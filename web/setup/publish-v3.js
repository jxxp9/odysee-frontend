// @flow
import * as tus from 'tus-js-client';
import NoopUrlStorage from 'tus-js-client/lib/noopUrlStorage';
import analytics from '../../ui/analytics';
import { ERR_GRP } from '../../ui/constants/errors';
import { X_LBRY_AUTH_TOKEN } from '../../ui/constants/token';
import { doUpdateUploadAdd, doUpdateUploadProgress, doUpdateUploadRemove } from '../../ui/redux/actions/publish';
import { generateError } from './publish-error';
import { LBRY_WEB_PUBLISH_API_V3 } from 'config';

const RESUMABLE_ENDPOINT = LBRY_WEB_PUBLISH_API_V3;
const RESUMABLE_ENDPOINT_METHOD = 'stream_create';
const UPLOAD_CHUNK_SIZE_BYTE = 25 * 1024 * 1024;

const SDK_STATUS_RETRY_COUNT = 12;
const SDK_STATUS_RETRY_INTERVAL = 10000;

const STATUS_CONFLICT = 409;
const STATUS_LOCKED = 423;

/**
 * Checks whether a given status is in the range of the expected category.
 *
 * @param status
 * @param category
 * @returns {boolean}
 */
function inStatusCategory(status, category) {
  return status >= category && status < category + 100;
}

function sendStatusRequest(url, guid, token, params, jsonPayload, retryCount, resolve, reject) {
  const xhr = new XMLHttpRequest();

  // $FlowIgnore
  xhr.open('GET', `${url}/status`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Tus-Resumable', '1.0.0');
  xhr.setRequestHeader(X_LBRY_AUTH_TOKEN, token);
  xhr.responseType = 'json';

  xhr.onload = () => {
    switch (xhr.status) {
      case 200:
        // Upload processed and available in network. SDK response in the body.
        window.store.dispatch(doUpdateUploadRemove(guid));
        resolve(xhr);
        break;

      case 202:
        // Upload is currently being processed.
        if (retryCount > 0) {
          setTimeout(() => {
            sendStatusRequest(url, guid, token, params, jsonPayload, retryCount - 1, resolve, reject);
          }, SDK_STATUS_RETRY_INTERVAL);
        } else {
          window.store.dispatch(doUpdateUploadProgress({ guid, status: 'error' }));
          reject(
            generateError('The file is still being processed. Check back later after a few minutes.', params, xhr)
          );
        }
        break;

      case 403:
      case 404:
        // Upload not found or does not belong to the user.
        window.store.dispatch(doUpdateUploadProgress({ guid, status: 'error' }));
        reject(generateError('The upload does not exist.', params, xhr));
        break;

      case 409:
        // SDK returned an error and upload cannot be processed. Error details in the body.
        const sdkError = xhr.response?.error?.message || '';
        const finalError = `Failed to process the uploaded file.\n\n${sdkError}`;
        console.error(sdkError); // eslint-disable-line no-console
        window.store.dispatch(doUpdateUploadProgress({ guid, status: 'error' }));
        reject(generateError(finalError, params, xhr));
        break;

      default:
        analytics.log(`v3/publish/status - unexpected response (${xhr.status})`);
        window.store.dispatch(doUpdateUploadProgress({ guid, status: 'error' }));
        reject(generateError(`Unexpected error: ${xhr.status}`, params, xhr));
        break;
    }
  };

  xhr.onerror = () => {
    reject(generateError(`Encountered a network error while checking the status of the upload.`, params, xhr));
  };

  xhr.send();
}

// ****************************************************************************
// ****************************************************************************

export function makeResumableUploadRequest(
  token: string,
  params: FileUploadSdkParams,
  file: File | string,
  isPreview?: boolean
) {
  return new Promise<any>((resolve, reject) => {
    if (!RESUMABLE_ENDPOINT) {
      reject(new Error('Publish: endpoint undefined'));
    }

    if (params.remote_url) {
      reject(new Error('Publish: v2 does not support remote_url'));
    }

    const { uploadUrl, guid, isMarkdown, sdkRan, ...sdkParams } = params;

    const jsonPayload = JSON.stringify({
      jsonrpc: '2.0',
      method: RESUMABLE_ENDPOINT_METHOD,
      params: sdkParams,
      id: new Date().getTime(),
    });

    const urlOptions = {};
    if (params.uploadUrl) {
      // Resuming from previous upload. TUS clears the resume fingerprint on any
      // 4xx error, so we need to use the fixed URL mode instead.
      urlOptions.uploadUrl = params.uploadUrl;
    } else {
      // New upload, so use `endpoint`.
      urlOptions.endpoint = RESUMABLE_ENDPOINT;
    }

    if (params.sdkRan) {
      sendStatusRequest(params.uploadUrl, guid, token, params, jsonPayload, 0, resolve, reject);
      return;
    }

    const uploader = new tus.Upload(file, {
      ...urlOptions,
      chunkSize: UPLOAD_CHUNK_SIZE_BYTE,
      retryDelays: [8000, 15000, 30000],
      parallelUploads: 1,
      storeFingerprintForResuming: false,
      urlStorage: new NoopUrlStorage(),
      removeFingerprintOnSuccess: true,
      headers: { [X_LBRY_AUTH_TOKEN]: token },
      metadata: {
        filename: file instanceof File ? file.name : file,
        filetype: file instanceof File ? file.type : undefined,
      },
      onShouldRetry: (err, retryAttempt, options) => {
        window.store.dispatch(doUpdateUploadProgress({ guid, status: 'retry' }));
        const status = err.originalResponse ? err.originalResponse.getStatus() : 0;
        return !inStatusCategory(status, 400) || status === STATUS_CONFLICT || status === STATUS_LOCKED;
      },
      onError: (err) => {
        const status = err.originalResponse ? err.originalResponse.getStatus() : 0;
        const errMsg = typeof err === 'string' ? err : err.message;

        let customErr;
        if (status === STATUS_LOCKED || errMsg === 'file currently locked') {
          customErr = 'File is locked. Try resuming after waiting a few minutes';
        } else if (errMsg.startsWith('tus: failed to upload chunk at offset')) {
          customErr = 'Error uploading chunk. Click "retry" in the Uploads page to resume upload.';
        }

        window.store.dispatch(doUpdateUploadProgress({ guid, status: 'error' }));
        analytics.log(err, {}, ERR_GRP.TUS);

        reject(generateError(customErr || err, params, null, uploader, customErr ? err : null));
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        window.store.dispatch(doUpdateUploadProgress({ guid, progress: percentage }));
      },
      onSuccess: () => {
        function makeNotifyRequest() {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${uploader.url}/notify`);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Tus-Resumable', '1.0.0');
          xhr.setRequestHeader(X_LBRY_AUTH_TOKEN, token);
          xhr.responseType = 'json';
          xhr.onload = () => {
            window.store.dispatch(doUpdateUploadProgress({ guid, status: 'notify_ok' }));
            sendStatusRequest(uploader.url, guid, token, params, jsonPayload, SDK_STATUS_RETRY_COUNT, resolve, reject);
          };
          xhr.onerror = () => {
            window.store.dispatch(doUpdateUploadProgress({ guid, status: 'notify_failed' }));
            reject(generateError(`Failed to process the file. Please retry. (${xhr.status})`, params, xhr, uploader));
          };
          xhr.onabort = () => {
            window.store.dispatch(doUpdateUploadRemove(guid));
          };
          return xhr;
        }

        const notify = makeNotifyRequest();
        notify.send(jsonPayload);
      },
    });

    window.store.dispatch(doUpdateUploadAdd(file, params, uploader));
    uploader.start();
  });
}
