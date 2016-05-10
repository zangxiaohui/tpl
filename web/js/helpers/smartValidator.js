(function($) {
    'use strict';

    var metadataConfig = {
        ajaxOldValue: 'ajaxOldValue',
        verified: 'verified',
        rules: {
            'required': 'data-rule-required',
            'minlength': 'data-rule-minlength',
            'maxlength': 'data-rule-maxlength',
            'rangelength': 'data-rule-rangelength',
            'min': 'data-rule-min',
            'max': 'data-rule-max',
            'range': 'data-rule-range',
            'equalTo': 'data-rule-equalto',
            'regex': 'data-rule-regex'
        },
        messages: {
            'required': 'data-msg-required',
            'minlength': 'data-msg-minlength',
            'maxlength': 'data-msg-maxlength',
            'rangelength': 'data-msg-rangelength',
            'min': 'data-msg-min',
            'max': 'data-msg-max',
            'range': 'data-msg-range',
            'equalTo': 'data-msg-equalto',
            'regex': 'data-msg-regex'
        },
        infos: 'data-info-tips',
        templates: {
            warningTips: '<div class="ui-tooltips ui-tooltips-warning validator-tooltips-warning">' + 
                            '<div class="ui-tooltips-arrow">' + 
                                '<i class="arrow arrow-out">&#9670;</i>' +
                                '<i class="arrow">&#9670;</i>' + 
                            '</div>' +
                            '<div class="ui-tooltips-content">' +
                                '<p class="ui-tooltips-msg validator-msg">' +
                                    '<i class="vipFont if-sigh">&#xe603;</i>' + 
                                '</p>' +
                            '</div>' +
                        '</div>',
            infoTips:   '<div class="ui-tooltips ui-tooltips-info validator-tooltips-info">' +
                            '<div class="ui-tooltips-arrow">' +
                                '<i class="arrow arrow-out">&#9670;</i>' +
                                '<i class="arrow">&#9670;</i>' +
                            '</div>' +
                            '<div class="ui-tooltips-content">' +
                                '<p class="validator-msg"></p>' +
                            '</div>' +
                        '</div>',
            successIcon: '<i class="ui-input-success vipFont if-success" style="display: none;">&#xe61e;</i>',
            warningIcon: '<i class="vipFont if-sigh">&#xe603;</i>'
        }
    };

    $.smartValidation = function(opts, form) {
        this.settings = opts;
        this.errorsMap = {};
        this.infosMap = {};
        this.$form = form;
        this.$submit = this.$form.find(this.settings.selectors.submit);
        this.$firstErrorElement = null;
        // 一个elment共有三个定时器, 'warning_'+name, 'warning2_'+name, 'info_'+name
        this.timers = {};
        this.init();
    }

    $.extend($.smartValidation, {
        defaults: {
            namespace: '.validator',
            metadata: false,
            infos: {},
            messages: {},
            rules: {},
            classNames: {
                tipsIn: 'z-ui-tooltips-in',
                tipsOut: 'z-ui-tooltips-out',
                tipsDirection: 'ui-tooltips-bottom-left-arrow',
                itemGroup: 'ui-form-item-group',
                warningItemGroup: 'z-ui-form-item-warning',
                warningTips: 'validator-tooltips-warning',
                infoTips: 'validator-tooltips-info',
                successIcon: 'z-ui-form-item-success',
                customWarningTips: 'custom-tooltips-warning',
                customInfoTips: 'custom-tooltips-info',
                btnLoading: 'z-ui-btn-loading',
                btnDisable: 'ui-btn-disable'
            },
            selectors: {
                submit: 'input[type="submit"], .form-submit',
                successIcon: '.if-success'
            },
            templates: {
                warningTips: metadataConfig.templates.warningTips,
                infoTips: metadataConfig.templates.infoTips,
                successIcon: metadataConfig.templates.successIcon,
                warningIcon: metadataConfig.templates.warningIcon
            },
            tipsStayTime: 2000,
            dependon: {},
            showSuccessIcon: true,
            onsubmit: function() {}
        },
        prototype: {
            init: function() {
                this.initConfig();
                this.initTips();
                this.initEvents();
            },
            // 初始化参数配置
            initConfig: function() {
                var _this = this,
                    metadataRules = {},
                    metadataMessages = {},
                    metadataInfos = {},
                    tempValue,
                    $elements,
                    $el;

                if (this.settings.metadata) {
                    $elements = this.$form.find('[data-rule-^]');

                    $.each($elements, function() {
                        var $me = $(this),
                            name = this.name || this.id;
                        tempRuleKey,
                        tempMsgKey;

                        for (var key in metadataConfig.rules) {
                            tempKey = 'rules-' + metadataConfig.rules[key];
                            if ($me.data(tempKey) !== undefined) {
                                metadataRules[name][key] = $me.data(tempKey);
                            }
                        }

                        for (var key in metadataConfig.messages) {
                            tempKey = 'rules-' + metadataConfig.messages[key];
                            if ($me.data(tempKey) !== undefined) {
                                metadataMessages[name][key] = $me.data(tempKey);
                            }
                        }

                        metadataInfos[name] = $me.attr(metadataConfig.infos);
                    });

                    this.validatorRules = $.extend(true, {}, metadataRules, this.settings.rules);
                    this.validatorMessages = $.extend(true, {}, metadataMessages, this.settings.messages);
                    this.validatorInfos = $.extend(true, {}, metadataInfos, this.settings.infos);
                }
                else {
                    this.validatorRules = this.settings.rules;
                    this.validatorMessages = this.settings.messages;
                    this.validatorInfos = this.settings.infos;
                }

                for (var ruleName in this.validatorRules) {
                    if (this.validatorInputs === undefined) {
                        this.validatorInputs = this.findElement(ruleName);
                    }
                    else {
                        this.validatorInputs = this.validatorInputs.add(this.findElement(ruleName));
                    }

                    if (this.validatorRules[ruleName]['ajax']) {
                        $el = this.findElement(ruleName);
                        tempValue = $.smartValidation.getValue($el);
                        $el.data(metadataConfig.ajaxOldValue, tempValue);
                    }
                }

                for (var infoName in this.validatorInfos) {
                    this.infosMap[infoName] = this.validatorInfos[infoName];
                }
            },
            // 初始化Tips, 动态加入到DOM
            initTips: function() {
                var _this = this,
                    $el,
                    $parent,
                    $temp;

                for (var key in this.validatorInfos) {
                    $el = this.findElement(key);
                    $parent = $el.parents('.' + this.settings.classNames.itemGroup);
                    $parent.prepend(this.settings.templates.infoTips);
                    $temp = $parent.children('.' + this.settings.classNames.infoTips).first();
                    $el.data('infoTips', $temp);
                }

                for (var key in this.validatorRules) {
                    $el = this.findElement(key);
                    $parent = $el.parents('.' + this.settings.classNames.itemGroup);
                    $parent.prepend(this.settings.templates.warningTips);
                    $temp = $parent.children('.' + this.settings.classNames.warningTips).first();
                    $el.data('warningTips', $temp);

                    // 为文本输入框插入成功样式
                    if (this.settings.showSuccessIcon) {
                        if ($el.is('input') && !this.isCheckable($el)) {
                            $el.eq(0).before(this.settings.templates.successIcon);
                        }
                    }
                }

                this.warningTips = this.$form.find('.' + this.settings.classNames.warningTips);
                this.infoTips = this.$form.find('.' + this.settings.classNames.infoTips);

                this.warningTips.addClass(this.settings.classNames.tipsDirection);
                this.infoTips.addClass(this.settings.classNames.tipsDirection);
            },
            // 初始化事件绑定
            initEvents: function() {
                var _this = this,
                    $checkableElements;

                function onblur(e) {
                    _this.onvalidate.call(_this, e);
                }

                function onfocus(e) {
                    var $target = $(e.target);
                    _this.focusElement.call(_this, $target);
                }

                function onsubmit(e) {
                    // 如果是超级链接，禁用默认行为。
                    if (e.target.tagName.toLowerCase() === 'a') {
                        e.preventDefault();
                    }

                    e.stopPropagation();

                    // sumbit button不是disable或loading状态时触发提交事件
                    if (!_this.$submit.hasClass(_this.settings.classNames.btnDisable) && !_this.$submit.hasClass(_this.settings.classNames.btnLoading)) {
                        _this.$submit.addClass(_this.settings.classNames.btnLoading);
                        _this.validateAllElements.call(_this, _this.settings.onsubmit);
                    }
                }

                // 绑定单个元素事件
                if (this.validatorInputs && this.validatorInputs.length > 0) {
                    this.validatorInputs.on('blur' + this.settings.namespace, onblur);
                    this.validatorInputs.on('focus' + this.settings.namespace, onfocus);

                    $checkableElements = this.validatorInputs.filter(function() {
                        return _this.isCheckable($(this));
                    });

                    // 如果是radio或checkbox点击时就验证
                    if ($checkableElements.length > 0) {
                        $checkableElements.on('click' + this.settings.namespace, $.proxy(this.onvalidate, this));
                    }
                }

                // 绑定submit事件
                this.$submit.on('click', onsubmit);
                this.$submit.on('submitCompelted', function() {
                    _this.$submit.removeClass(_this.settings.classNames.btnLoading);
                });
            },
            onvalidate: function(e) {
                e.stopPropagation();
                var $target = $(e.target);
                var $parent = $target.parents('.' + this.settings.classNames.itemGroup);
                var $customTips = $parent.find('.' + this.settings.classNames.customWarningTips + ', .' + this.settings.classNames.customInfoTips);

                // 移除tips出场事件计时器
                $target.off('keydown' + this.settings.namespace);

                this.hideCustomTips($customTips);
                this.tipsOnBlur($target);
                this.validateElement.call(this, $target);
            },
            optional: function($el) {
                return !$.smartValidation.methods.required.call(this, $el);
            },
            // 获取方法需要执行的参数
            getMethodParam: function($el, rule, method) {
                var result = [],
                    args = rule[method]['param'] || rule[method];

                result.push($el);

                switch (method) {
                    case 'required':
                        break;
                    case 'equalTo':
                        // 字符串或者jQuery选择器
                        if (typeof args === 'string') {
                            result.push($(args, this.$form));
                        }
                        else if (args && args instanceof jQuery) {
                            result.push(args);
                        }

                        break;
                    default:
                        if (args.constructor === Array) {
                            for (var i = 0, j = args.length; i < j; i++) {
                                result.push(args[i]);
                            }
                        }
                        else {
                            result.push(args);
                        }
                }

                return result;
            },
            // 检查表单即时验证规则
            check: function($el) {
                var name = $el.attr('name'),
                    rule = this.validatorRules[name],
                    hasAjax = rule['ajax'] === undefined ? false : true,
                    nameDependon = this.settings.dependon[name],
                    isDependency = this.checkDependon(nameDependon),
                    onValidCallback = this.settings.onvalid ? this.settings.onvalid[name] : null,
                    onInvalidCallback = this.settings.oninvalid ? this.settings.oninvalid[name] : null,
                    invalidLength = 0,
                    msg;

                // 通过依赖项检查
                if (isDependency) {
                    for (var method in rule) {
                        var args,
                            tempValue,
                            dependon,
                            invoke = true;

                        // 同步即时校验
                        if (method !== 'ajax') {
                            dependon = rule[method]['dependon'];
                            invoke = this.checkDependon(dependon);

                            args = this.getMethodParam($el, rule, method);

                            if (invoke === true) {
                                if ($.smartValidation.methods[method].apply(this, args)) {
                                    tempValue = $.smartValidation.getValue($el);
                                    delete this.errorsMap[name];
                                    this.hideItemWarning($el);

                                    if (this.isCheckable($el)) {
                                        this.hideWarningTips($el);
                                    }

                                    continue;
                                }
                                else {
                                    msg = this.validatorMessages[name][method] || '';
                                    $el.data(metadataConfig.verified, false);
                                    this.errorsMap[name] = msg;
                                    this.hideSuccessIcon($el);
                                    this.showItemWarning($el);
                                    invalidLength++;
                                    onInvalidCallback && onInvalidCallback();
                                    break;
                                }
                            }
                        }
                    }

                    // 通过验证
                    if (invalidLength === 0) {
                        // 没有ajax验证或者ajax验证已通过，马上加上sucess样式
                        if (!hasAjax || ($el.data(metadataConfig.ajaxOldValue) === tempValue && $el.data(metadataConfig.verified) === true)) {
                            $el.data(metadataConfig.verified, true);
                            this.showSuccessIcon($el);
                        } 

                        onValidCallback && onValidCallback();  
                    }
                }
            },
            checkDependon: function(dependon) {
                var invoke = true;

                if (dependon) {
                    switch (typeof dependon) {
                        case "boolean":
                            invoke = dependon
                            break;
                        case "string":
                            invoke = this.$form.find(dependon).length > 0;
                            break;
                        case "function":
                            invoke = dependon.call(this);
                            break;
                    }
                }

                return invoke;
            },
            // 验证表单内单个element
            validateElement: function($el) {
                this.check($el);

                // 当同步校验都通过时，开始异步ajax校验
                this.validateAjax($el);
            },
            // 检查表单内需要验证的所有元素，如果验证通过，执行callback, 如果有错误显示第一个错误。
            validateAllElements: function(callback) {
                var _this = this,
                    error,
                    ajaxs = [],
                    $customTips = this.$form.find('.' + this.settings.classNames.customWarningTips + ', .' + this.settings.classNames.customInfoTips);

                this.hideCustomTips($customTips);

                if (this.validatorInputs && this.validatorInputs.length > 0) {
                    this.validatorInputs.each(function() {
                        var $me = $(this);
                        var name = $me.attr('name');
                        var rule = _this.validatorRules[name];

                        _this.check($me);

                        if (rule['ajax'] && typeof rule['ajax'] === 'object') {
                            _this.appendAjaxList($me, ajaxs);
                        }
                    });
                }

                if (ajaxs.length > 0) {
                    // 所有ajax成功返回后完成回调
                    $.when.apply($, ajaxs).done(function() {
                        _this.handleSubmit.call(_this, callback);
                    });
                }
                else {
                    _this.handleSubmit.call(_this, callback);
                }
            },
            // 处理form submit.
            handleSubmit: function(callback) {
                var error;

                // 通过所有验证，调用回调函数.
                if ($.isEmptyObject(this.errorsMap)) {
                    this.$firstErrorElement = null;
                    callback && callback();
                }
                else {
                    // 如果有错，显示第一个错误
                    this.$submit.trigger('submitCompelted');
                    error = this.getFirstError();
                    if (error) {
                        this.$firstErrorElement = error.$el;
                        this.showError(error.$el, error.msg);
                    }
                }
            },
            // 异步ajax验证，用在同步验证通过之后
            validateAjax: function($el) {
                var name = $el.attr('name'),
                    nameDependon = this.settings.dependon[name],
                    isDependency = this.checkDependon(nameDependon),
                    rule = this.validatorRules[name];

                // 检查依赖项
                if (isDependency) {
                    // 当同步校验都通过时，开始异步ajax校验
                    if (!this.errorsMap[name]) {
                        // 异步校验，ajax数据格式：{ajax: {ajaxoptions, callback: funcation(data){}}
                        // callback返回为{valid: true, msg: '消息'};
                        if (rule['ajax'] && typeof rule['ajax'] === 'object') {
                            var remoteParam = [];
                            var tempValue = $.smartValidation.getValue($el);

                            // 如果值发生变化或者原先ajax验证未通过，则进行ajax验证
                            if (tempValue !== $el.data(metadataConfig.ajaxOldValue) || $el.data(metadataConfig.verified) === false) {
                                $el.data(metadataConfig.ajaxOldValue, tempValue);
                                $el.data(metadataConfig.verified, false);
                                remoteParam.push($el);
                                remoteParam.push(rule['ajax']);
                                return $.smartValidation.methods['ajax'].apply(this, remoteParam);
                            }
                        }
                    }
                }
            },
            // 把ajax deferred对象放入数组
            appendAjaxList: function($el, list) {
                var deferred = this.validateAjax($el);
                if (deferred) {
                    list.push(deferred);
                }
            },
            // 获取表单内的第一个错误
            getFirstError: function() {
                var _this = this,
                    result = null;

                // 在需要验证的输入框里找出第一个错误
                this.validatorInputs.each(function() {
                    var $me = $(this),
                        name = $me.attr('name');

                    // 找到则立即退出
                    if (_this.errorsMap[name]) {
                        result = {
                            $el: $me,
                            name: name,
                            msg: _this.errorsMap[name]
                        }

                        return false;
                    }
                });

                return result;
            },
            reset: function() {
                var _this = this;

                this.validatorInputs.each(function() {
                    var $me = $(this);
                    _this.resetTimer($me);
                    _this.hideItemWarning($me);
                    _this.hideSuccessIcon($me);
                    _this.hideWarningTips($me);
                    $me.removeData(metadataConfig.verified);
                    $me.removeData(metadataConfig.ajaxOldValue);
                });

                $.each(this.infoTips, function(index, value) {
                    var $input = _this.$form.find('[name="' + index + '"]');
                    _this.resetTimer($me);
                    _this.hideInfoTips($input);
                });

                this.errorsMap = {};
                this.infosMap = {};
                this.firstErrorElement = null;
            },
            // 聚焦element时的行为
            focusElement: function($el) {
                this.resetTimer($el);

                var name = $el.attr('name'),
                    $warningTips = $el.data('warningTips'),
                    $infoTips = $el.data('infoTips'),
                    $parent = $el.parents('.' + this.settings.classNames.itemGroup),
                    $customWarningTips = this.$form.find('.' + this.settings.classNames.customWarningTips),
                    $customInfoTips = this.$form.find('.' + this.settings.classNames.customInfoTips),
                    _this = this;

                this.hideSuccessIcon($el);
                this.hideItemWarning($el);

                function onkeydown() {
                    if (_this.settings.tipsStayTime > 0) {
                        _this.timers['warning_' + name] = setTimeout(function() {
                            // 添加tips出场时的样式
                            $warningTips.addClass(_this.settings.classNames.tipsOut);

                            // 150ms后，删除进场出场时的样式
                            _this.timers['warning2_' + name] = setTimeout(function() {
                                _this.hideWarningTips($el);
                            }, 150);
                        }, _this.settings.tipsStayTime);
                    }
                }

                if (this.errorsMap[name]) {
                    if ($warningTips) {
                        // 隐藏自定义tooltips 
                        this.hideCustomTips($customWarningTips);
                        this.hideCustomTips($customInfoTips);

                        // 存在第一个错误且不是当前聚焦的那个, 则隐藏第一个错误。
                        if (this.$firstErrorElement && !this.$firstErrorElement.is($el)) {
                            this.resetTimer(this.$firstErrorElement);
                            this.hideWarningTips(this.$firstErrorElement);
                        }

                        this.showWarningTips($el, this.errorsMap[name]);

                        // 当开始输入时，启动tips出场事件计时器
                        $el.one('keydown' + this.settings.namespace, onkeydown);
                    }
                }
                else {
                    if ($infoTips) {
                        // 隐藏自定义tooltips 
                        this.hideCustomTips($customWarningTips);
                        this.hideCustomTips($customInfoTips);

                        // 存在第一个错误且不是当前聚焦的那个, 则隐藏第一个错误。
                        if (this.$firstErrorElement && !this.$firstErrorElement.is($el)) {
                            this.resetTimer(this.$firstErrorElement);
                            this.hideWarningTips(this.$firstErrorElement);
                        }

                        this.showInfoTips($el, this.infosMap[name]);
                    }
                }
            },
            // 失去焦点时输入框样式
            tipsOnBlur: function($el) {
                this.resetTimer($el);

                var _this = this,
                    name = $el.attr('name'),
                    $warningTips = $el.siblings('.' + this.settings.classNames.warningTips),
                    $infoTips = $el.siblings('.' + this.settings.classNames.infoTips);

                if ($warningTips.length > 0) {
                    $warningTips.addClass(this.settings.classNames.tipsOut);
                    this.timers['warning2_' + name] = setTimeout(function() {
                        $warningTips.removeClass(_this.settings.classNames.tipsIn + ' ' + _this.settings.classNames.tipsOut);
                    }, 150);
                }

                if ($infoTips.length > 0) {
                    $infoTips.addClass(this.settings.classNames.tipsOut);
                    this.timers['info_' + name] = setTimeout(function() {
                        $infoTips.removeClass(_this.settings.classNames.tipsIn + ' ' + _this.settings.classNames.tipsOut);
                    }, 150);
                }
            },
            // 在this.$form范围内查找元素
            findElement: function(name) {
                var $el = this.$form.find('[name="' + name + '"]');
                return $el;
            },
            // 重置timer
            resetTimer: function($el) {
                var name = $el.attr('name'),
                    warningName = 'warning_' + name,
                    warningName2 = 'waring2_' + name,
                    infoName = 'info_' + name;

                if (this.timers[warningName]) {
                    clearTimeout(this.timers[warningName]);
                }

                if (this.timers[warningName2]) {
                    clearTimeout(this.timers[warningName2]);
                }

                if (this.timers[infoName]) {
                    clearTimeout(this.timers[infoName]);
                }
            },
            // 是否为password
            isPassword: function($el) {
                return (/password/i).test($el.attr('type'));
            },
            // 是否为checkable元素
            isCheckable: function($el) {
                return (/radio|checkbox/i).test($el.attr('type'));
            },
            // 获取元素的长度
            getLength: function($el) {
                switch ($el[0].tagName.toLowerCase()) {
                    case "select":
                        return $("option:selected", $el).length;
                    case "input":
                        if (this.isCheckable($el)) {
                            return this.findElement($el.attr('name')).filter(':checked').length;
                        }
                }

                return $el.val().length;
            },
            // 显示input文本框success icon.
            showSuccessIcon: function($el) {
                var $successIcon = $el.prev(this.settings.selectors.successIcon);

                if ($el.is('input') && !this.isCheckable($el) && $successIcon.length > 0) {
                    $successIcon.show();
                    $el.parents('.' + this.settings.classNames.itemGroup).addClass(this.settings.classNames.successIcon);
                }
            },
            // 隐藏input文本框success icon.
            hideSuccessIcon: function($el) {
                var $successIcon = $el.prev(this.settings.selectors.successIcon);

                if ($successIcon.length > 0) {
                    $successIcon.hide();
                    $el.parents('.' + this.settings.classNames.itemGroup).removeClass(this.settings.classNames.successIcon);
                }
            },
            // 为输入框标红
            showItemWarning: function($el) {
                $el.parents('.' + this.settings.classNames.itemGroup).addClass(this.settings.classNames.warningItemGroup);
            },
            // 为输入框取消标红
            hideItemWarning: function($el) {
                $el.parents('.' + this.settings.classNames.itemGroup).removeClass(this.settings.classNames.warningItemGroup);
            },
            // 为输入框标红并显示错误消息
            showError: function($el, errorMsg) {
                this.showItemWarning($el);
                this.showWarningTips($el, errorMsg);
                this.hideSuccessIcon($el);
            },
            // 为输入框取消标红并隐藏错误消息
            hideError: function($el) {
                this.hideItemWarning($el);
                this.hideWarningTips($el);
            },
            // 为element加入错误状态
            addErrorState: function($el, errorMsg) {
                var name = $el.attr('name');
                this.errorsMap[name] = errorMsg; 
            },
            // 为element移除错误状态
            removeErrorState: function($el) {
                var name = $el.attr('name');
                if (this.errorsMap[name]) {
                    delete this.errorsMap[name];
                }
            },
            // 每次只显示一个warning tips
            showWarningTips: function($el, errorMsg) {
                var $warningTips = $el.data('warningTips');

                if ($warningTips) {
                    $warningTips.find('.validator-msg').html(this.settings.templates.warningIcon + errorMsg);
                    if (!$warningTips.hasClass(this.settings.classNames.tipsIn)) {
                        $warningTips.addClass(this.settings.classNames.tipsIn);
                    }
                }
            },
            // 隐藏warning tips
            hideWarningTips: function($el) {
                var $warningTips = $el.data('warningTips');

                if ($warningTips) {
                    $warningTips.removeClass(this.settings.classNames.tipsIn + ' ' + this.settings.classNames.tipsOut);
                }
            },
            // 显示info tips
            showInfoTips: function($el, msg) {
                var $infoTips = $el.data('infoTips');

                if ($infoTips) {
                    $infoTips.find('.validator-msg').html(msg);
                    if (!$infoTips.hasClass(this.settings.classNames.tipsIn)) {
                        $infoTips.addClass(this.settings.classNames.tipsIn);
                    }
                }
            },
            // 隐藏info tips
            hideInfoTips: function($el) {
                var $infoTips = $el.data('infoTips');

                if ($infoTips) {
                    $infoTips.removeClass(this.settings.classNames.tipsIn + ' ' + this.settings.classNames.tipsOut);
                }
            },
            showCustomTips: function($tips, msg) {
                if ($tips.length > 0) {
                    $tips.find('.validator-msg')
                        .html(msg)
                        .end()
                        .removeClass(this.settings.classNames.tipsIn + ' ' + this.settings.classNames.tipsOut)
                        .addClass(this.settings.classNames.tipsIn);
                }
            },
            hideCustomTips: function($tips) {
                if ($tips.length > 0) {
                    $tips.removeClass(this.settings.classNames.tipsIn + ' ' + this.settings.classNames.tipsOut);
                }
            }
        },
        getValue: function($el) {
            if ($el.is('input') || $el.is('textarea') || $el.is('select')) {
                return $.trim($el.val());
            }
            else {
                return $el.attr('data-value');
            }
        },
        addMethod: function(name, method) {
            $.smartValidation.methods[name] = method;
        },
        serializeForm: function($form) {
            var $inputs = $form.find('input[type="text"], input[type="password"], input[type="hidden"], input[type="file"], input[type="checkbox"], input[type="radio"], select, textarea');
            var result = [];
            var groups = {};

            $inputs.each(function() {
                var _this = $(this);
                var name = _this.attr('name');

                if (groups[name]) {
                    groups[name].push(_this);
                } else {
                    groups[name] = [_this];
                }
            });

            $.each(groups, function(key, value) {
                var temp,
                    checkTemp = [],
                    checkTempValue = '',
                    radioTempValue = '',
                    isRadioChecked = false,
                    len,
                    $el,
                    keepSpace;

                if (value[0].is('[type="text"]') ||
                    value[0].is('[type="password"]') ||
                    value[0].is('[type="hidden"]') ||
                    value[0].is('[type="file"]') ||
                    value[0].is('select') ||
                    value[0].is('textarea')) {

                    for (var i in value) {
                        if (value[i].data('keep-space') === true) {
                            result.push(key + '=' + value[i].val());
                        }
                        else {
                            result.push(key + '=' + $.trim(value[i].val()));
                        }
                    }
                } else if (value[0].is('[type="checkbox"]')) {
                    if (value instanceof Array && value.length > 1) {
                        len = value.length;

                        for (var i = 0; i < len; i++) {
                            $el = value[i];
                            if ($el.is(':checked')) {
                                keepSpace = $el.data('keep-space');
                                checkTempValue = keepSpace === true ? $el.val() : $.trim($el.val());
                                checkTemp.push(checkTempValue);
                            }
                        }
                    } else {
                        if (value[0].is(':checked')) {
                            $el = value[0];
                            keepSpace = $el.data('keep-space');
                            checkTempValue = keepSpace === true ? $el.val() : $.trim($el.val());
                            checkTemp.push(checkTempValue);
                        }
                    }

                    // 有数据时，加入到数组
                    if (checkTemp.length > 0) {
                        result.push(key + '=' + checkTemp.join(','));
                    }
                } else if (value[0].is('[type="radio"]')) {
                    if (value instanceof Array && value.length > 1) {
                        len = value.length;

                        for (var i = 0; i < len; i++) {
                            $el = value[i];
                            if ($el.is(':checked')) {
                                isRadioChecked = true;
                                keepSpace = $el.data('keep-space');
                                radioTempValue = keepSpace === true ? $el.val() : $.trim($el.val());

                                break;
                            }
                        }
                    } else {
                        if (value[0].is(':checked')) {
                            isRadioChecked = true;
                            $el = value[0];
                            keepSpace = $el.data('keep-space');
                            radioTempValue = keepSpace === true ? $el.val() : $.trim($el.val());
                        }
                    }

                    if (isRadioChecked) {
                        result.push(key + '=' + radioTempValue);
                    }
                }
            });

            return result.join('&');
        },
        methods: {
            required: function($el) {
                if ($el[0].tagName.toLowerCase() === "select") {
                    var val = $el.val();
                    return val && val.length > 0;
                }
                if (this.isCheckable($el)) {
                    return this.getLength($el) > 0;
                }
                if (this.isPassword($el)) {
                    return $el.val().length > 0;
                }

                return $.trim($el.val()).length > 0;
            },
            minlength: function($el, length) {
                var val = $el.val();
                return this.optional($el) || val.length >= length;
            },
            maxlength: function($el, length) {
                var val = $el.val();
                return this.checkOptionsl($el) || val.length <= length;
            },
            rangelength: function($el, min, max) {
                var val = $el.val();
                return this.optional($el) || (val.length >= min && val.length <= max);
            },
            min: function($el, digit) {
                var val = $el.val(),
                    num;

                if (this.optional($el) && typeof val === 'string') {
                    num = parseInt(val);
                    return num >= digit;
                }

                return false;
            },
            max: function($el, digit) {
                var val = $el.val(),
                    num;

                if (this.optional($el) && typeof val === 'string') {
                    num = parseInt(val);
                    return num <= digit;
                }

                return false;
            },
            range: function($el, min, max) {
                var val = $el.val(),
                    num;

                if (this.optional($el) && typeof val === 'string') {
                    num = parseInt(val);
                    return num >= min && num <= max;
                }

                return false;
            },
            equalTo: function($elOne, $elTwo) {
                var valOne = $elOne.val(),
                    valTwo = $elTwo.val();

                return valOne === valTwo;
            },
            regex: function($el, pattern) {
                var val = $el.val();

                return this.optional($el) || pattern.test(val);
            },
            ajax: function($el, options) {
                if (this.optional($el)) {
                    return;
                }

                var _this = this,
                    name = $el.attr('name');

                var ajaxOpts = {
                    dataType: 'json',
                    success: function(data) {
                        if (typeof options.callback !== 'function') {
                            $.error('the ajax method missing callback function.');
                            return;
                        }

                        var result = options.callback(data);
                        var tempValue = $.smartValidation.getValue($el);

                        if (result.valid) {
                            // 更新旧值，以及验证是否通过
                            $el.data(metadataConfig.verified, true);
                            delete _this.errorsMap[name];
                            _this.hideItemWarning($el);
                            _this.showSuccessIcon($el);
                        }
                        else {
                            $el.data(metadataConfig.verified, false);
                            _this.errorsMap[name] = result.msg;
                            _this.showItemWarning($el);
                            _this.hideSuccessIcon($el);
                        }

                    }
                };

                var opts = $.extend(true, {}, options, ajaxOpts);
                return $.ajax(opts);
            }
        }
    });

    // validator是jQuery.fn对象
    var validator = function(options) {
        var opts = $.extend(true, {}, $.smartValidation.defaults, options),
            smartValidator;

        if (this.length === 0) {
            $.error("Nothing element selected for validating");
            return;
        }

        smartValidator = $.data(this.eq(0), 'smartValidator');

        if (smartValidator && smartValidator instanceof $.smartValidation) {
            return smartValidator;
        }

        smartValidator = new $.smartValidation(opts, this.eq(0));
        $.data(this.eq(0), "smartValidator", smartValidator);
        return smartValidator;
    }

    if (typeof define === 'function' && define.cmd) {
        define(function(require, exports, module) {
            $.fn.smartValidator = validator;
        });
    }
    else {
        $.fn.smartValidator = validator;
    }

})(jQuery);
