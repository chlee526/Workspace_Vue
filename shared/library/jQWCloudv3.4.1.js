import jQuery from 'jquery';

(function ($) {
    var LB = 1, //Left Bottom
        LT = 2, //Left Top
        RT = 3, //Right Top
        RB = 4, //Right Bottom
        HR = 1, //Horizontal
        VR = 2, //Vertical
        WordObjType = 'span',
        DIV = 'div',
        distance_Counter = 1,
        word_counter = 1,
        cloudOpts = null;

    var wc = null;

    function Util() {}
    //To Generate Random Colors For Words
    Util.getRandomColor = function () {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.round(Math.random() * 15)];
        }
        return color;
    };

    function space(spaceType, width, height, x, y) {
        this.spaceType = spaceType;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }

    function Word(wordConfig) {
        this.code = wordConfig.code;
        this.word = wordConfig.word;
        this.weight = wordConfig.weight;

        this.fontFactor = wordConfig.fontFactor;
        this.fontOffset = wordConfig.fontOffset;
        this.minWeight = wordConfig.minWeight;
        this.maxWeight = wordConfig.maxWeight;
        this.padding_left = wordConfig.padding_left;

        this.font_family = wordConfig.font_family;
        this.font = null;
        this.color = wordConfig.color;
        this.span = null;
        this.width = null;
        this.height = null;
        this.word_class = wordConfig.word_class;

        this.legend = wordConfig.legend ? wordConfig.legend : false;

        this._init();
    }
    Word.prototype = {
        _init: function () {
            this._setFont();
            this._setSpan_Size();
        },
        _setFont: function () {
            // this.maxWeight - this.minWeight 이 0일 때 fontFactor가 Infinity 되는 오류 보정
            const factor = this.fontFactor === Infinity ? 1 : this.fontFactor;
            // origin wordCloud font size setting logic
            const weight = Math.floor((this.weight - this.minWeight) * factor + this.fontOffset);
            // word가 하나일 때/ word의 모든 weight가 동일할 때 maxFont minFont의 중간값 설정
            this.font = this.maxWeight - this.minWeight === 0 ? Math.round((wc.options.maxFont - wc.options.minFont) / 2 + this.fontOffset) : weight;
        },
        _setSpan_Size: function () {
            var span = document.createElement(WordObjType);
            span.setAttribute('id', 'Word_' + word_counter++ + '_' + this.weight);
            document.body.appendChild(span);
            $(span).css({
                position: 'absolute',
                display: 'block',
                left: -999990,
                top: 0,
            });
            $(span).css('font-size', this.font + 'px');

            if (this.word_class != null && this.word_class != '') $(span).addClass(this.word_class);

            var color;
            if (this.color != null && this.color != '') color = this.color;
            else color = '#666666';

            $(span).attr('data-bubble-id', cloudOpts.id + '_' + this.code);
            $(span).attr('data-code', this.code);
            $(span).css('color', color);
            $(span).css('-webkit-user-select', 'none').css('-moz-user-select', 'none').css('-ms-user-select', 'none');
            $(span).css('user-select', 'none').css('-o-user-select', 'none');
            $(span).css('line-height', this.font + 'px');
            if (this.padding_left == null) this.padding_left = 0;

            $(span).html("<span class='bg' style='border-color:" + color + ';background:' + color + "CC'></span><span>" + this.word + '</span>');

            /**
             * 241128
             * 기존 + 6
             * 최대 폰트 사이즈 비율 대로 +로 수정
             * item 간 사이 공간 변경 목적
             */
            if (cloudOpts.space !== null) {
                if (cloudOpts?.space === 'auto') {
                    this.width = $(span).outerWidth() + wc.options.maxFont / 3;
                    this.height = $(span).outerHeight() + wc.options.maxFont / 4;
                } else if (cloudOpts?.space >= 0) {
                    this.width = $(span).outerWidth() + cloudOpts.space;
                    this.height = $(span).outerHeight() + cloudOpts.space;
                }
            } else {
                this.width = $(span).outerWidth() + 6;
                this.height = $(span).outerHeight() + 6;
            }

            $(span).remove();
            this.span = span;
        },
    };

    function WordCloud() {
        this.defaultOptions = {
            title: 'JQ WOrd Cloud',
            words: [],
            minFont: 10,
            maxFont: 50,
            fontOffset: 0,
            showSpaceDIV: false,
            verticalEnabled: true,
            cloud_color: null,
            cloud_font_family: null,
            spaceDIVColor: 'white',
            padding_left: null,
            word_common_classes: null,
            word_click: function () {},
            word_mouseOver: function () {},
            word_mouseEnter: function () {},
            word_mouseOut: function () {},
            beforeCloudRender: function () {},
            afterCloudRender: function () {},
        };
        this.minWeight = null;
        this.maxWeight = null;

        this.spaceDataObject = null;
        this.spaceIdArray = null;
        this.words = null;
        this.fontFactor = 1;
        this.methods = {
            destroy: this._destroy,
        };
    }

    WordCloud.prototype = {
        _init: function (options) {
            distance_Counter = 1;
            word_counter = 1;
            cloudOpts = options;

            //Calling Methods from this.Methods{}
            if (options != null && typeof options === 'string')
                if (this.methods[options] != null) return this.methods[options].apply();
                else return null;

            if (options == null) this.options = this.defaultOptions;
            else if (options != null && typeof options === 'object') this.options = $.extend(this.defaultOptions, options);

            this.spaceDataObject = {};
            this.spaceIdArray = [];

            this.words = this.options.words;
            //Sorting Words according weight descending order
            this.words.sort(function (a, b) {
                if (a.weight < b.weight) {
                    return 1;
                } else if (a.weight > b.weight) {
                    return -1;
                } else {
                    return 0;
                }
            });

            this.options.beforeCloudRender();
            this._start();
            this.options.afterCloudRender();
            this._final();
        },
        _setFontFactor: function () {
            this.maxWeight = this.words[0].weight;
            this.minWeight = this.words[this.words.length - 1].weight;
            this.fontFactor = (this.options.maxFont - this.options.minFont) / (this.maxWeight - this.minWeight);
        },
        _start: function () {
            this._destroy();
            this._setFontFactor();
            this._draw();
        },
        _final: function () {},
        _destroy: function () {
            this.$target.html('');
        },
        _setTarget: function ($target) {
            this.$target = $target;
            $target.css('position', 'relative');
            this.tWidth = $target.innerWidth();
            this.xOffset = this.tWidth / 2;

            this.tHeight = $target.innerHeight();
            this.yOffset = this.tHeight / 2;
        },
        _draw: function () {
            // for(var index=0; index<this.words.length; index++){
            var _this = this;
            const { weight: maxWeight } = this.words.sort((a, b) => b.weight - a.weight)[0];
            this.words.filter(function ($item, index) {
                var currWord = $item;
                var wordConfigObj = {};
                wordConfigObj['code'] = currWord.code;
                wordConfigObj['word'] = currWord.word;
                wordConfigObj['weight'] = currWord.weight;

                if (_this.options.cloud_color != null) wordConfigObj['color'] = _this.options.cloud_color;
                else wordConfigObj['color'] = currWord.color;

                if (_this.options.padding_left != null) wordConfigObj['padding_left'] = _this.options.padding_left;

                wordConfigObj['word_class'] = currWord.word_class;

                if (_this.options.cloud_font_family != null) wordConfigObj['font_family'] = _this.options.cloud_font_family;
                else wordConfigObj['font_family'] = currWord.font_family;

                wordConfigObj['fontFactor'] = _this.fontFactor;
                wordConfigObj['fontOffset'] = _this.options.fontOffset + _this.options.minFont;
                wordConfigObj['minWeight'] = _this.minWeight;
                wordConfigObj['maxWeight'] = maxWeight;

                var wordObj = new Word(wordConfigObj);

                if (_this.options.word_common_classes != null) $(wordObj.span).addClass(_this.options.word_common_classes);

                var data = JSON.parse(JSON.stringify(_this.words[index]));
                $(wordObj.span).on('click', function () {
                    _this.options.word_click(currWord);
                });
                $(wordObj.span).on('mouseover', function ($e) {
                    _this.options.word_mouseOver($e, currWord);
                });
                $(wordObj.span).on('mouseout', function ($e) {
                    _this.options.word_mouseOut($e, currWord);
                });
                $(wordObj.span).on('mouseenter', _this.options.word_mouseEnter);

                if (index == 0) _this._placeFirstWord(wordObj);
                else _this._placeOtherWord(wordObj);
            });
        },

        _updateSpaceIdArray: function (distanceS, distance) {
            if (this.spaceIdArray.length != 0) {
                for (var index = 0; index < this.spaceIdArray.length; index++) {
                    if (distance < parseFloat(this.spaceIdArray[index].split('_')[0])) {
                        this.spaceIdArray.splice(index, 0, distanceS);
                        return;
                    }
                }
                this.spaceIdArray.push(distanceS);
            } else this.spaceIdArray.push(distanceS);
        },
        _showSpaceDiv: function (type, w, h, x, y) {
            var xMul = 1;
            var yMul = 1;

            switch (type) {
                case LB:
                    xMul = 0;
                    yMul = -1;
                    break;
                case LT:
                    xMul = 0;
                    yMul = 0;
                    break;
                case RT:
                    xMul = -1;
                    yMul = 0;
                    break;
                case RB:
                    xMul = -1;
                    yMul = -1;
                    break;
            }

            var div = document.createElement(DIV);
            $(div)
                .css('left', parseInt(x + xMul * w))
                .css('top', parseInt(y + yMul * h))
                .css('width', w)
                .css('height', h)
                .css('border', '1px ' + this.options.spaceDIVColor + ' solid')
                .css('position', 'absolute')
                .css('display', 'block');
            this.$target.append(div);
        },
        _pushSpaceData: function (type, w, h, x, y) {
            //Calculating Distance between (x,y): Key point of Space and and Center of Container (this.xOffset,this.yOffset)
            var distance = Math.sqrt((this.xOffset - x) * (this.xOffset - x) + (this.yOffset - y) * (this.yOffset - y));
            var distanceS = distance + '_' + distance_Counter++;

            //Update Space Id Array
            this._updateSpaceIdArray(distanceS, distance);
            //Add Space into Space Data Object
            this.spaceDataObject[distanceS] = new space(type, w, h, x, y);

            // To Show The Space
            if (this.options.showSpaceDIV) {
                this._showSpaceDiv(type, w, h, x, y);
            }
        },
        _placeFirstWord: function (word) {
            var w = word.width;
            var h = word.height;
            var xoff = this.xOffset - w / 2;
            var yoff = this.yOffset - h / 2;
            var tw = this.tWidth;
            var th = this.tHeight;

            var span = word.span;
            $(span).css('left', xoff).css('top', yoff).css('display', 'inline');
            this.$target.append(span);

            this._pushSpaceData(LB, tw - xoff - w, h, xoff + w, yoff + h / 2); //M1
            this._pushSpaceData(LT, w, th - yoff - h, xoff + w / 2, yoff + h); //M2
            this._pushSpaceData(RT, xoff, h, xoff, yoff + h / 2); //M3
            this._pushSpaceData(RB, w, yoff, xoff + w / 2, yoff); //M4

            this._pushSpaceData(LT, w / 2, h / 2, xoff + w, yoff + h / 2); //C1
            this._pushSpaceData(RT, w / 2, h / 2, xoff + w / 2, yoff + h); //C2
            this._pushSpaceData(RB, w / 2, h / 2, xoff, yoff + h / 2); //C3
            this._pushSpaceData(LB, w / 2, h / 2, xoff + w / 2, yoff); //C4

            this._pushSpaceData(LT, tw - xoff - w - w / 2, th - yoff - h / 2, xoff + w + w / 2, yoff + h / 2); //S1
            this._pushSpaceData(RT, xoff + w / 2, th - yoff - h - h / 2, xoff + w / 2, yoff + h + h / 2); //S2
            this._pushSpaceData(RB, xoff - w / 2, yoff + h / 2, xoff - w / 2, yoff + h / 2); //S3
            this._pushSpaceData(LB, xoff + w / 2, yoff - h / 2, xoff + w / 2, yoff - h / 2); //S4
        },

        _placeOtherWord: function (word) {
            for (var index = 0; index < this.spaceIdArray.length; index++) {
                var spaceId = this.spaceIdArray[index];
                var obj = this.spaceDataObject[spaceId];

                var alignmentInd = 0;
                var alignmentIndCount = 0;

                if (word.width <= obj.width && word.height <= obj.height) {
                    alignmentInd = HR;
                    alignmentIndCount++;
                }

                if (this.options.verticalEnabled) {
                    if (word.height <= obj.width && word.width <= obj.height) {
                        alignmentInd = VR;
                        alignmentIndCount++;
                    }
                }
                if (alignmentIndCount > 0) {
                    this.spaceDataObject[spaceId] = null;
                    this.spaceIdArray.splice(index, 1);

                    //For Word's Span Position
                    var xMul = 1;
                    var yMul = 1;

                    //For new Child Spaces
                    var xMulS = 1;
                    var yMulS = 1;

                    switch (obj.spaceType) {
                        case LB:
                            xMul = 0;
                            yMul = -1;
                            xMulS = 1;
                            yMulS = -1;
                            break;
                        case LT:
                            xMul = 0;
                            yMul = 0;
                            xMulS = 1;
                            yMulS = 1;
                            break;
                        case RT:
                            xMul = -1;
                            yMul = 0;
                            xMulS = -1;
                            yMulS = 1;
                            break;
                        case RB:
                            xMul = -1;
                            yMul = -1;
                            xMulS = -1;
                            yMulS = -1;
                            break;
                    }

                    if (alignmentIndCount > 1) {
                        //Making Horizontal Word in Larger Number
                        // Random number[0,5] is >0 and <3 --> HR
                        // Random number[0,5] is >3 --> VR

                        if (Math.random() * 5 > 3) alignmentInd = VR;
                        else alignmentInd = HR;
                    }

                    var w = word.width;
                    var h = word.height;

                    switch (alignmentInd) {
                        case HR:
                            var span = word.span;
                            $(span)
                                .css('left', obj.x + xMul * w)
                                .css('top', obj.y + yMul * h)
                                .css('display', 'inline');
                            this.$target.append(span);

                            if (Math.random() * 2 > 1) {
                                /*
                                 * 			_________________________________
                                 *			|								|
                                 *			|				T				|
                                 *			|								|
                                 *			|_______________________________|
                                 *			|				|				|
                                 *			|	  WORD		|		R		|
                                 *			|	********	|				|
                                 *			|_______________|_______________|
                                 *
                                 */

                                this._pushSpaceData(obj.spaceType, obj.width - w, h, obj.x + xMulS * w, obj.y); //R
                                this._pushSpaceData(obj.spaceType, obj.width, obj.height - h, obj.x, obj.y + yMulS * h); //T
                            } else {
                                /*
                                 * 			_________________________________
                                 *			|				|				|
                                 *			|		T		|				|
                                 *			|				|				|
                                 *			|_______________|		R		|
                                 *			|				|				|
                                 *			|	  WORD		|				|
                                 *			|	********	|				|
                                 *			|_______________|_______________|
                                 *
                                 */

                                this._pushSpaceData(obj.spaceType, obj.width - w, obj.height, obj.x + xMulS * w, obj.y); //R
                                this._pushSpaceData(obj.spaceType, w, obj.height - h, obj.x, obj.y + yMulS * h); //T
                            }
                            break;

                        case VR:
                            var span = word.span;
                            //IE Handling for Differenet way of Rotation Transforms
                            if (jQuery.browser && jQuery.browser.msie) {
                                $(span)
                                    .css('left', obj.x + xMul * h)
                                    .css('top', obj.y + yMul * w);
                            } else {
                                $(span)
                                    .css('left', obj.x + xMul * h - (w - h) / 2)
                                    .css('top', obj.y + yMul * w + (w - h) / 2);
                            }

                            $(span).css('display', 'block').css('-webkit-transform', 'rotate(270deg)').css('-moz-transform', 'rotate(270deg)');
                            $(span).css('-o-transform', 'rotate(270deg)').css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=3)');
                            this.$target.append(span);

                            if (Math.random() * 2 > 1) {
                                /*
                                 * 			_________________________________
                                 *			|								|
                                 *			|				T				|
                                 *			|								|
                                 *			|_______________________________|
                                 *			|		D		|				|
                                 *			|		R		|		R		|
                                 *			|		O		|				|
                                 *			|_______W_______|_______________|
                                 *
                                 */

                                this._pushSpaceData(obj.spaceType, obj.width - h, w, obj.x + xMulS * h, obj.y); //R
                                this._pushSpaceData(obj.spaceType, obj.width, obj.height - w, obj.x, obj.y + yMulS * w); //T
                            } else {
                                /*
                                 * 			_________________________________
                                 *			|				|				|
                                 *			|		T		|				|
                                 *			|				|				|
                                 *			|_______________|		R		|
                                 *			|		D		|				|
                                 *			|	  	R		|				|
                                 *			|		O		|				|
                                 *			|_______W_______|_______________|
                                 *
                                 */

                                this._pushSpaceData(obj.spaceType, obj.width - h, obj.height, obj.x + xMulS * h, obj.y); //R
                                this._pushSpaceData(obj.spaceType, h, obj.height - w, obj.x, obj.y + yMulS * w); //T
                            }
                            break;
                    }

                    return;
                }
            }
        },
    };

    $.fn.jQWCloud = function (options) {
        wc = new WordCloud();
        wc._setTarget($(this));
        $.data(this, 'jqw_cloud', wc);
        wc._init(options);
    };
})(jQuery);
