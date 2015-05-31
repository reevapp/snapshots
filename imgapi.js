/**
 * FreeImgApi : ReevApp Free Image API, Version 0.9-beta
 * http://www.reevapp.com
 *
 * This API is licensed under Apache License, Version 2.0
 *
 * Copyright 2014 Re-Evolution Applications, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var JsSnapshotAPI = function(_apiKey) {

    /**
     * Used to pass onto HTML Objects a reference to this API instance
     * @type {JsSnapshotAPI}
     */
    var self = this;

    /**
     * URL for the entry point
     * @type {string}
     */
    this.apiEntryPoint = 'http://api.reevapp.com';

    /**
     * Where to find the placeholder image to use while loading the snapshot
     * @type {string}
     */
    this.urlImgLoading = 'https://snapshots.fr-1.storage.online.net/Resources/Images/Loading/Loading-WIDTHxHEIGHT.png';

    /**
     * Where to find Error Images, re-define this value to use custom Error images
     * @type {string}
     */
    this.urlImgError = 'https://snapshots.fr-1.storage.online.net/Resources/Images/Error/ERROR_CODE/Error-WIDTHxHEIGHT.png';

    /**
     * The number of times a snapshot will be retried before the request is considered in error state
     * @type {number}
     */
    this.maxRetry = 3;

    /**
     * The API Key to use in requesting services
     * @type {string}
     */
    this.apiKey = _apiKey;

    /**
     * Whether the API key in use is from a non-paid plan
     * Free API Keys start with 1
     * @type {boolean}
     */
    this.isFreeApiKey = this.apiKey.charAt(0) == '1';

    /**
     * The current version's unique identifier
     * @type {string}
     */
    this.version='v0.9-beta';

    /**
     * Known Error Codes and Descriptions
     * @type {{1: string}}
     */
    this.errDesc = {
        10 : '111',
        20 : '222',
        30 : '333',
        40 : '444',
        50 : '555',
        60 : '666',
        70 : '777',
        80 : '888',
        90 : '999',
        100 : '10-10-10',
        400 : '40-40-40',
        600 : '60-60-60'
    };

    /**
     * List of those error codes that are worth retrying the request
     * @type {number[]}
     */
    this.recoverableErrorCodes = [
        10,20,30,40,50,60,70,80,90,100,400
    ];

    /**
     * Loads a Website's icon
     * @param _url Website's URL, the 'path' part of the URL is ignored
     * @param _imgObject
     * @param _retryCount
     */
    this.loadWebsiteIcon = function (_url, _imgObject, _retryCount) {
        //TODO Implement logic
    };

    /**
     * Generates a new Snapshot and refreshes the given IMG tag with its representation,
     * in case a snapshot cannot be generated, a status image will be used instead with
     * the reason for the failure
     * @param _url URL to be snapshot
     * @param _imgObject The instance of IMG tag to receive the generated image, if null then the request will be considered as a "preload"
     * @param _preload When set to true will inform the server that the image is not to be returned, but rather prepared for a future request
     * @param _width Width, in pixels for the Image, will use the target Image object if 0 or less
     * @param _height Height, in pixels for the Image, will use the target Image object if 0 or less
     * @param _maxAge Maximum age, in minutes, of the snapshot if one already exists
     * @param _retryCount How many times to retry loading the image in case of a recoverable error, default is 2 (for a total of 3 attempts)
     */
    this.loadSnapshot = function (_url, _imgObject, _preload, _width, _height, _maxAge, _retryCount) {

        //Verify Parameters
        if (!_url || _url.trim().length==0) {
            //Must have a URL
            this.log('URL not provided');

            return false;
        }

        //If no IMG tag is passed, consider the request as a "preload"
        if (!_imgObject) {
            _preload = true;
        }

        //Set default retry count if none is set
        if (!_retryCount && _retryCount != 0) {
            _retryCount = this.maxRetry;
        }

        //Set default maxAge count if none is set
        if (!_maxAge && _maxAge < 0) {
            _maxAge = 0;
        }

        var imgRequest = new Image();
        var reqUrl = this.apiEntryPoint + '/free?api_call=true&apikey=' + encodeURI(this.apiKey) + '&version=' + encodeURI(this.version) + '&rnd=' + Math.random() + '&maxage=' + _maxAge + '&url=' + encodeURI(_url);
        var placeholder = this.urlImgLoading.replace('WIDTH', _width).replace('HEIGHT', Math.ceil(_width * 0.75).toString(10));

        if (_width && _width > 0) {
            //Custom Width
            reqUrl = reqUrl + '&w=' + _width;

            //Custom Height, only passed along a valid Width
            if (_height && _height > 0) {
                reqUrl = reqUrl + '&h=' + _height;
            }
        } else if (_imgObject.width && _imgObject.width > 0) {
            //If invalid dimensions are provided, use those of the IMG tag
            _width = _imgObject.width;
            _height = _imgObject.height;
        }

        if (!_preload) {
            //Load a placeholder image
            _imgObject.src = placeholder;

            //Once it completely loads, change target Image Tab
            imgRequest.onload = function () {
                if (imgRequest.width > 0 && imgRequest.height == 1) {
                    var errorCode = imgRequest.width;
                    //Server Returned an Error Code

                    //Retry if still it did not run out of retries
                    if (_retryCount > 0 && self.recoverableErrorCodes.indexOf(errorCode) >= 0) {
                        //Try again

                        self.log('Retrying snapshot generation ' + _retryCount + ' time(s) more for: ' + _url, errorCode);

                        self.loadSnapshot(_url, _width, _height, _preload, _imgObject, _retryCount-1);
                    } else {
                        //Load Error Page

                        self.log('Error generating snapshot for: ' + _url, errorCode);

                        _imgObject.src = self.errorImage(_width, _height, errorCode);
                    }
                } else {
                    //Load snapshot to target IMAGE tag
                    _imgObject.src = reqUrl;
                }
            };
        }

        //Shows error message
        imgRequest.onerror = imgRequest.onabort = function () {
            //Retry if still it did not run out of retries

            if (_retryCount > 0) {
                //Try again

                self.log('Retrying snapshot generation ' + _retryCount + ' time(s) more for: ' + _url);

                self.loadSnapshot(_url, _width, _height, _preload, _imgObject, _retryCount-1);
            } else {
                //Load Error Page
                self.log('Could not communicate with server or error 500 returned, error generating Snapshot for: ' + _url);

                _imgObject.src = self.errorImage(_width, _height);
            }
        };

        //Request Image
        imgRequest.src = reqUrl;

        //Indicate that Request went through
        return true;
    };

    /**
     * Converts an Error Code to a Human Readable Description
     * @param _errorCode
     */
    this.errorCodeToDescription = function (_errorCode) {
        return this.errDesc[_errorCode];
    }

    /**
     * Generate and return the URL for the Error Image to use, based on the Error Code and Dimensions
     * @param _width
     * @param _height
     * @param _errorCode
     */
    this.errorImage = function (_width, _height, _errorCode) {
        var errorType;
        var imagePath = this.urlImgError;

        //Define error type
        if (_errorCode>=600) {
            //A HTTP 500 error was returned
            errorType = 'HTTP-500';
        } else if (_errorCode>100) {
            //A HTTP Code was returned
            errorType = 'HTTP-' + (_errorCode/100 * 100);
        } else if (!_errorCode && _errorCode!= 0) {
            //No Error Code received
            errorType = 0;
        } else {
            //Other error, internal codes
            errorType = _errorCode/10;
        }

        //Define where to find the error image
        imagePath = imagePath.replace('ERROR_CODE', errorType);
        imagePath = imagePath.replace('WIDTH', _width).replace('HEIGHT', Math.ceil(_width * 0.75).toString(10));

        return imagePath;
    };

    /**
     * Standardized Log Message
     * @param _message Message to print
     * @param _errorCode Error Code, will be also translated to a description (if available)
     */
    this.log = function (_message, _errorCode) {
        var msg = (new Date()) + ' - JsSnapshotAPI - ' + this.version + ' - ' + _message;

        if (_errorCode && _errorCode>0) {
            msg = msg + " - Error Code: " + _errorCode + ', Description: ' + this.errorCodeToDescription(_errorCode);
        }

        console.log(msg);
    }
};
