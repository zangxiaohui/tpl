(function($) {

    'use strict';
    // 禁用IE10以上自带的CapsLock大写键开启提示
    document.msCapsLockWarningOff = true;
    $.smartValidation.addMethod('checkpwd', function($el) {
        var val = $el.val(),
            name = $el.attr('name'),
            result = PasswordRules.validate(val);

        if (result.success) {
            delete this.validatorMessages[name]['checkpwd'];
        }
        else {
            this.validatorMessages[name]['checkpwd'] = result.message;
        }
        if($el.attr('id') == 'J_email_pwd'){
            var loginName = $.trim($('#J_email_name').val());
            if(val == loginName){
                this.validatorMessages[name]['checkpwd'] = '密码不能与登录名一致';
                result.success = false;
            }
        }
        return result.success;
    });
    

    var registerForm = {
        domain: '.vip.com',
        activeStatus: 'active_status',
        activeMailName: 'active_mail_name',
        init: function() {
            var mobileConfig, emailConfig;

            if (typeof registerFormPageSourceType === 'undefined') {
                registerForm.pageSource = 0;
            }
            else {
                registerForm.pageSource = registerFormPageSourceType;
            }

            registerForm.initMarsSeed();
            registerForm.initControls();
            registerForm.tryShowEmailForm();
            registerForm.trySetSingleRegisterLink();

            // 绑定事件
            registerForm.controls.password.on('keyup', registerForm.events.checkStrength);
            registerForm.controls.password.on('keypress', registerForm.events.checkCapsLock);
            registerForm.controls.confirmPwd.on('keypress', registerForm.events.checkConfirmPwdCapsLock);
            registerForm.controls.btnVerifyCode.on('click', registerForm.sms.sendSms);
            registerForm.controls.inputVerifyCode.on('focus', registerForm.sms.focusVerifyCode);
            registerForm.controls.regFormLink.on('click', registerForm.events.showEnterForm);
            registerForm.controls.systemErrorTips.find('.close').on('click', registerForm.hideSystemErrorTips);
            registerForm.controls.diaClose.on('click', registerForm.floating.close);
            registerForm.controls.diaMailbox.on('click', registerForm.floating.loginMailbox);
            registerForm.controls.diaTimedown.on('click', registerForm.floating.showTimeTip);
            $(window).on('resize', registerForm.floating.setPosition);

            // 为IE10以下加入placeholder特性
            registerForm.controls.formWrapper.placeholder();

            // 加入验证
            if (isThirdLogin) {
                mobileConfig = registerForm.configs.mobileRegister;
                emailConfig = registerForm.configs.emailRegister;
            }
            else {
                mobileConfig = $.extend(true, {}, registerForm.configs.mobileRegister);
                emailConfig = $.extend(true, {}, registerForm.configs.emailRegister);
            }

            registerForm.mobileValidation = registerForm.controls.moForm.smartValidator(mobileConfig);
            registerForm.emailValidation = registerForm.controls.emForm.smartValidator(emailConfig);
        },
        initMarsSeed: function() {
            var $el, mars;

            if (typeof registerFormMarsSeed !== 'undefined') {
                for (var key in registerFormMarsSeed) {
                    $el = $(key);
                    mars = registerFormMarsSeed[key];

                    // url 埋点
                    if (mars.indexOf("ff=") > -1) {
                        if ($el.attr("href").indexOf("?") < 0) {
                            $el.attr('href', $el.attr("href") + "?" + mars);
                        }
                        else {
                            $el.attr('href', $el.attr("href") + "&" + mars);
                        }
                    }
                    else {
                        $el.attr('mars_sead', mars);
                    }
                }
            }
        },
        initControls: function() {
            var $formWrapper = $('#reg-form-wrapper');
            var $dialogMail = $('#dialog_tip');
            registerForm.controls = {
                // common controls
                formWrapper: $formWrapper,
                password: $formWrapper.find('input[name="password"]'),
                btnVerifyCode: $formWrapper.find('.btn-verify-code'),
                regFormLink: $formWrapper.find('.reg-form-link'),
                systemErrorTips: $formWrapper.find('.ui-tips1'),
                loginLink: $('#J_normal_loginlink'),
                inputVerifyCode: $formWrapper.find('.ipt-verify-code'),
                confirmPwd: $formWrapper.find('.confirm-pwd'),

                // mobile form controls, mo开头
                moForm: $('#reg_mobile_form'),
                moMobile: $('#J_mobile_name'),
                moMan: $('#J_mobile_man'),
                moWoman: $('#J_mobile_woman'),
                moPassword: $('#J_mobile_pwd'),
                moConfirmPassword: $('#J_mobile_confirm_pwd'),
                moCode: $('#J_mobile_code'),
                moVerifyCodeBtn: $('#J_mobile_verifycode_btn'),
                moRegBtn: $('#J_mobile_reg_button'),
                moAgree: $('#J_mobile_agree'),

                // email form controls, em开头
                emForm: $('#reg_email_form'),
                emName: $('#J_email_name'),
                emMan: $('#J_email_man'),
                emWoman: $('#J_email_woman'),
                emPassword: $('#J_email_pwd'),
                emConfirmPassword: $('#J_email_confirm_pwd'),
                emMobile: $('#J_email_mobile'),
                emCode: $('#J_email_code'),
                emVerifyCodeBtn: $('#J_email_verifycode_btn'),
                emRegBtn: $('#J_email_reg_button'),
                emAgree: $('#J_email_agree'),

                // 第三方绑定注册
                thirdChannel: $('#thirdChannel'),
                bindToken: $('#bind_token'),

                //邮箱注册成功 浮窗显示 , dia开头
                dialogMail: $dialogMail,
                diaMedium: $('#j-dialog-medium'),
                diaMask: $dialogMail.find('.ui-window-mask'),
                diaMain: $dialogMail.find('.main_tip'),
                diaTime: $dialogMail.find('.tip_time'),
                diaClose: $dialogMail.find('.ui-dialog-close'),
                diaMailbox: $dialogMail.find('.login_mailbox'),
                diaMailAcc: $dialogMail.find('.mail_account'),
                diaTimedown: $dialogMail.find('.repeat_send'),
                diaSuccess: $dialogMail.find('.success_tip'),
                diaFailure: $dialogMail.find('.failure_tip'),

                singleSignLink: $formWrapper.find('.single-sign-link'),
                successCode: $('#J_success_code')
            }
        },
        showSystemErrorTips: function(errorMsg) {
            registerForm.controls.systemErrorTips.removeClass('hidden')
                .find('.info-msg')
                .html(errorMsg);

            registerForm.systemErrorTimer = setTimeout(function() {
                registerForm.hideSystemErrorTips();
            }, 5000);
        },
        hideSystemErrorTips: function() {
            if (registerForm.systemErrorTimer) {
                clearTimeout(registerForm.systemErrorTimer);
            }

            registerForm.controls.systemErrorTips.addClass('hidden')
                .find('.info-msg')
                .html('');
        },
        callb2c: function(signedApiUrl) {
            $.ajax({
                url: signedApiUrl + "&callback=?",
                cache: false,
                crossDomain: true,
                contentType: 'application/json',
                dataType: "jsonp",
                success: function(result) {
                    if (result.status == 1) {
                        // 调用core.js 重定向方法
                        redirect2Src();
                    }
                    else {
                        alert('请求失败，请刷新页面重试 ');
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    // 调用core.js 重定向src     
                    redirect2Src();
                    return;
                }
            });
        },
        tryShowEmailForm: function() {
            var link;
            var regByEmail = getQueryStringByName('regbyemail');

            if (regByEmail === 'true') {
                registerForm.controls.moForm.addClass('hidden');
                registerForm.controls.emForm.removeClass('hidden');
                registerForm.tryShowFloating();
            }

            if (registerForm.controls.loginLink.length > 0) {
                link = registerForm.controls.loginLink.attr('href');
                link = link.indexOf('?') > -1 ? link.substr(0, link.indexOf('?')) : link;
                registerForm.controls.loginLink.attr('href', link + '?ff=125|2|1|1');
            }
        },
        tryShowFloating: function() {
            var activeStatus = VIPSHOP.cookie.get(registerForm.activeStatus);
            var emailName = VIPSHOP.cookie.get(registerForm.activeMailName);

            if (activeStatus == 'false' && emailName != '') {
                registerForm.floating.open();
            }
        },
        resetSecretFields: function() {
            var $indicator = registerForm.controls.formWrapper.find('.strength-indicator');
            var mobileSecret = [registerForm.controls.moPassword, registerForm.controls.moConfirmPassword, registerForm.controls.moCode];
            var emailSecret = [registerForm.controls.emPassword, registerForm.controls.emConfirmPassword, registerForm.controls.emCode];

            // 清空手机注册页面的密码，短信验证码的值及状态
            registerForm.resetFields(registerForm.mobileValidation, mobileSecret);

            if (!registerForm.isSupportPlaceholder()) {
                for (var i = 0, j = mobileSecret.length; i < j; i++) {
                    mobileSecret[i].siblings('.ie-placeholder').show();
                }
            }

            // 清空邮箱注册页面的密码，短信验证码的值及状态
            registerForm.resetFields(registerForm.emailValidation, emailSecret);

            if (!registerForm.isSupportPlaceholder()) {
                for (var i = 0, j = emailSecret.length; i < j; i++ ) {
                    emailSecret[i].siblings('.ie-placeholder').show();
                }
            }

            $indicator.removeClass('login-pwd-w login-pwd-m login-pwd-s').hide();
            registerForm.controls.moPassword.parents('.control-group').removeClass('mb0');
            registerForm.controls.emPassword.parents('.control-group').removeClass('mb0');
        },
        resetFields: function(validation, eles) {
            var len = eles.length;
            var $el;

            for (var i = 0; i < len; i++) {
                $el = eles[i];
                $el.val('');
                validation.hideError($el);
                validation.hideSuccessIcon($el);
                validation.removeErrorState($el);
            }
        },
        trySetSingleRegisterLink: function() {
            var href, returnUrl;

            if (registerForm.controls.singleSignLink.length > 0) {
                href = registerForm.controls.singleSignLink.attr('href');
                href = href.indexOf('?') > -1 ? href + '&' : href + '?';
                returnUrl = document.referrer ? document.referrer : '';
                href += 'src=' + encodeURIComponent(returnUrl);

                registerForm.controls.singleSignLink.attr('href', href);
            }
        },
        isSupportPlaceholder: function() {
            var result = 'placeholder' in document.createElement('input');
            return result;
        },
        floating: {
            setPosition: function() {
                var ele = registerForm.controls.diaMedium;
                var oWin = $(window);
                var diaLeft, diaTop;

                if (ele.length > 0) {
                    diaLeft = (oWin.width() - ele.outerWidth()) / 2;
                    diaTop = (oWin.height() - ele.outerHeight()) * 0.45 + oWin.scrollTop();

                    ele.css({
                        left: diaLeft,
                        top: diaTop
                    });
                }
            },
            open: function() {
                var ele = registerForm.controls.diaMedium;
                var emailName = VIPSHOP.cookie.get(registerForm.activeMailName);
                registerForm.floating.setPosition();
                ele.addClass('z-ui-dialog-in');
                registerForm.controls.diaMask.show();

                registerForm.controls.diaMailAcc.html(emailName);
            },
            close: function() {
                var target = $(this).parents('.z-ui-dialog-in');
                target.addClass('z-ui-dialog-out');
                registerForm.controls.diaMask.hide();
                setTimeout(function() {
                    target.removeClass('z-ui-dialog-in z-ui-dialog-out');
                }, 350);

                window.clearInterval(registerForm.tiemDown);
                registerForm.controls.diaSuccess.hide();
                registerForm.controls.diaFailure.hide();
                registerForm.controls.diaTime.html("120");
                registerForm.resetSecretFields();
            },
            loginMailbox: function() {
                var url = registerForm.controls.diaMailAcc.text().split('@')[1];
                for (var i in registerForm.configs.emailboxLogin) {
                    if (url.match(i)) {
                        window.location.href = registerForm.configs.emailboxLogin[url];
                    }
                    else {
                        window.location.href = "http://mail." + url;
                    }
                }
            },
            showTimeTip: function() {
                $.ajax({
                    "type": "post",
                    "url": ctx + "/account/sendMail",
                    "data": {
                        "mailName": registerForm.controls.diaMailAcc.text(),
                        "pageSource": registerForm.pageSource
                    },
                    "success": function(rtn) {
                        if (registerForm.tiemDown) {
                            clearInterval(registerForm.tiemDown);
                            registerForm.controls.diaTime.html('120');
                        }

                        if (rtn.errorCode == "0") {
                            registerForm.tiemDown = setInterval(registerForm.floating.timedown, 1000);
                            registerForm.controls.diaSuccess.show();
                            registerForm.controls.diaFailure.hide();
                        }
                        else if (rtn.errorCode == "1") {
                            registerForm.controls.diaSuccess.hide();
                            registerForm.controls.diaFailure.show();
                        }
                        else if (rtn.errorCode == "2") {
                            registerForm.floating.close();
                            location.href = location.href;
                        }
                    },
                    "error": function(rtn) {
                        registerForm.controls.diaSuccess.hide();
                        registerForm.controls.diaFailure.show();
                    },
                    "dataType": "json"
                })

            },
            timedown: function() {
                var time = parseInt(registerForm.controls.diaTime.html());
                time--;
                registerForm.controls.diaTime.html(time);
                if (time == 0) {
                    window.clearInterval(registerForm.tiemDown);
                    registerForm.controls.diaSuccess.hide();
                    registerForm.controls.diaFailure.hide();
                    registerForm.controls.diaTime.html("120");
                }
            }
        },
        sms: {
            countdown: function($el, cookieTime) {
                var time = 60;
                var countdownHtml = '<span class="countdown-time f-pink">' + time + '</span>秒后重新获取';
                var tempHtml;

                $el.html(countdownHtml).removeClass('ui-btn-secondary').addClass('ui-btn-disable');

                registerForm.smsTimer = setInterval(function() {
                    time--;
                    if (time === 0) {
                        if (cookieTime === 0) {
                            $el.html('获取验证码').addClass('ui-btn-disable').removeClass('ui-btn-secondary');
                        }
                        else {
                            $el.html('获取验证码').removeClass('ui-btn-disable').addClass('ui-btn-secondary');
                        }

                        clearInterval(registerForm.smsTimer);
                    }
                    else if (time > 0) {
                        tempHtml = '<span class="countdown-time f-pink">' + time + '</span>秒后重新获取';
                        $el.html(tempHtml);
                    }
                }, 1000);
            },
            stopCountdown: function($form) {
                var $btn = $form.find('.btn-verify-code');
                $btn.html('获取验证码').removeClass('ui-btn-disable').addClass('ui-btn-secondary');

                if (registerForm.smsTimer) {
                    clearInterval(registerForm.smsTimer);
                }
            },
            sendSms: function(e) {
                e.stopPropagation();
                var $target = $(e.target);

                // 不是短信发送按钮
                if (!$target.hasClass('btn-verify-code')) {
                    return;
                }

                var $form = $target.parents('form');
                var $phone = $form.find('.ipt-phone');
                var $verifyInput = $form.find('.ipt-verify-code');
                var $customInfoTips = $target.parents('.ui-form-item-group').find('.custom-tooltips-info');
                var key = 'times_' + $.trim($phone.val());
                var cookieTime = VIPSHOP.cookie.get(key);
                var leftCookieTime;
                var validation = $form.is(registerForm.controls.moForm) ? registerForm.mobileValidation : registerForm.emailValidation;

                // 移除验证码的错误样式
                validation.hideError($verifyInput);
                validation.removeErrorState($verifyInput);

                if (cookieTime === '0') {
                    validation.showCustomTips($customInfoTips, registerForm.configs.smsInfoTips['exceedLimited']);
                }

                function handleSmsData(data) {
                    if (data.head.result == 'success') {
                        // 把发送电话写入cookie
                        if (cookieTime == '') {
                            validation.showCustomTips($customInfoTips, registerForm.configs.smsInfoTips['other']);
                            // 过期时间为24小时
                            leftCookieTime = 9;
                            VIPSHOP.cookie.set(key, leftCookieTime, registerForm.domain, null, 24);
                        }
                        else {
                            leftCookieTime = parseInt(cookieTime) - 1;

                            switch (cookieTime) {
                                case '3':
                                case '2':
                                case '1':
                                    validation.showCustomTips($customInfoTips, registerForm.configs.smsInfoTips[cookieTime]);
                                    VIPSHOP.cookie.set(key, leftCookieTime, registerForm.domain, null, 24);
                                    break;
                                default:
                                    validation.showCustomTips($customInfoTips, registerForm.configs.smsInfoTips['other']);
                                    VIPSHOP.cookie.set(key, leftCookieTime, registerForm.domain, null, 24);
                            }

                        }

                        registerForm.sms.countdown($target, leftCookieTime);
                        $phone.data('pvssid', data.body.data);
                    }
                    else {
                        var errmsg = registerForm.configs.smsErrorCode[data.head.code];
                        errmsg = errmsg === undefined ? registerForm.configs.smsInfoTips['occurError'] : errmsg;

                        validation.showCustomTips($customInfoTips, errmsg);
                    }
                }

                // 检查短信按钮是否可用或手机短信是否已发完
                if (!$target.hasClass('ui-btn-disable') && cookieTime !== '0') {
                    $phone.data('pvssid', '');

                    $.ajax({
                        "type": "POST",
                        "url": ctx + "/register/send_phone_verify",
                        "data": {
                            phone: $.trim($phone.val())
                        },
                        cache: false,
                        success: function(data) {
                            handleSmsData(data);
                        },
                        error: function() {
                            validation.showCustomTips($customInfoTips, registerForm.configs.smsInfoTips['occurError']);
                        },
                        "dataType": "json"
                    });
                }
            },
            // 当改变手机号码时，设置发送短信按钮状态
            setSmsButtonStatus: function($form, isPhoneValid) {
                var $phone = $form.find('.ipt-phone');
                var key = 'times_' + $.trim($phone.val());
                var cookieTime = VIPSHOP.cookie.get(key);
                var $btn = $form.find('.btn-verify-code');

                registerForm.sms.stopCountdown($form);

                if (isPhoneValid) {
                    if (cookieTime === '0') {
                        $btn.removeClass('ui-btn-secondary').addClass('ui-btn-disable');
                    }
                }
                else {
                    $btn.removeClass('ui-btn-secondary').addClass('ui-btn-disable')
                }
            },
            focusVerifyCode: function(e) {
                var $target = $(e.target);
                var $form = $target.parents('form');
                var $customInfoTips = $target.parents('.ui-form-item-group').find('.custom-tooltips-info');
                var validation = $form.is(registerForm.controls.moForm) ? registerForm.mobileValidation : registerForm.emailValidation;

                validation.hideCustomTips($customInfoTips);
            }
        },
        data: {
            /** 
             * 检查手机或邮箱ajax返回的数据
             * data ajax返回的数据
             * userType 0为手机，1为邮箱
             * $form 发送短信按钮的表单
             */
            checkUserName: function(data, userType, $form) {
                var result = {};
                var errorCodeMap;

                if (typeof(data.result) != 'undefined' && data.result == 'haslogin') {
                    // 调用core.js里的方法
                    if (clsoseMessenger()) {
                        return false;
                    }
                    redirect2Src();
                    return;
                }

                if (userType === 0) {
                    errorCodeMap = registerForm.configs.mobileCheckerErrorCode;
                }
                else {
                    errorCodeMap = registerForm.configs.emailCheckerErrorCode;
                }

                if (typeof data.result !== 'undefined' && data.result === 'success') {
                    result.valid = true;

                    if ($form) {
                        registerForm.sms.setSmsButtonStatus($form, true);
                    }
                }
                else if (typeof data.result !== 'undefined' && data.result === 'error') {
                    result.valid = errorCodeMap[data.errorCode][0];
                    result.msg = registerForm.data.addSeedForTipsLoginLink(data.errorCode, errorCodeMap[data.errorCode][1], userType);

                    if ($form) {
                        registerForm.sms.setSmsButtonStatus($form, errorCodeMap[data.errorCode][0]);
                    }
                }
                else {
                    result.valid = false;
                    result.msg = '系统发生错误，请重试';

                    if ($form) {
                        registerForm.sms.setSmsButtonStatus($form, false);
                    }
                }

                return result;
            },
            // userType 0为手机，1为邮箱
            addSeedForTipsLoginLink: function(errorCode, msg, userType) {
                if (errorCode === 9) {
                    return msg.replace(/\{0\}/g, registerForm.configs.tipsLoginSeed[registerForm.pageSource][userType]);
                }

                return msg;
            }
        },
        events: {
            checkStrength: function(e) {
                var $target = $(e.target),
                    $form = $target.parents('form'),
                    $indicator = $form.find('.strength-indicator'),
                    result = PasswordRules.validate($target.val());

                $target.parents('.control-group').addClass('mb0');
                $indicator.show();
                $indicator.removeClass('login-pwd-w login-pwd-m login-pwd-s');
                $indicator.addClass('login-pwd-' + result.strength);
            },
            checkCapsLock: function(e) {
                var isCapsLock = capslock.detect(e),
                    $target = $(e.target),
                    $infoTips;

                // 未验证或已通过验证, 则显示大小写已开启
                if ($target.data('verified') === undefined || $target.data('verified') === true) {
                    $infoTips = $target.parents('.ui-form-item-group').find('.validator-tooltips-info');

                    if (isCapsLock) {
                        $infoTips.find('.validator-msg').html('键盘大写锁定已打开，请注意大小写');
                        if (!$infoTips.hasClass('z-ui-tooltips-in')) {
                            $infoTips.addClass('z-ui-tooltips-in');
                        }
                    }
                    else {
                        $infoTips.find('.validator-msg').html('密码由6-20位字母，数字和符号至少两种以上字符组合，区分大小写');
                    }
                }
            },
            showEnterForm: function(e) {
                e.preventDefault();

                var $target = $(e.target);
                var $form = $target.parents('form');
                var link;

                $form.addClass('hidden');
                $form.siblings('.register-form').removeClass('hidden');

                if (registerForm.controls.loginLink.length > 0) {
                    link = registerForm.controls.loginLink.attr('href');
                    link = link.indexOf('?') > -1 ? link.substr(0, link.indexOf('?')) : link;

                    // 点击了通过邮箱注册
                    if ($target.attr('id') === 'J_mobile_to_email') {
                        registerForm.controls.loginLink.attr('href', link + '?ff=125|2|2|1');
                    }
                    // 点击了手机快速注册
                    else if ($target.attr('id') === 'J_email_to_mobile') {
                        registerForm.controls.loginLink.attr('href', link + '?ff=125|2|1|1');
                    }
                }

                // 点击了通过邮箱注册
                if ($target.attr('id') === 'J_mobile_to_email' || $target.attr('id') === 'J_mobile_third_email') {
                    registerForm.tryShowFloating();
                }
            },
            checkConfirmPwdCapsLock: function(e) {
                var isCapsLock = capslock.detect(e),
                    $target = $(e.target),
                    $infoTips;

                // 未验证或已通过验证, 则显示大小写已开启
                if ($target.data('verified') === undefined || $target.data('verified') === true) {
                    $infoTips = $target.parents('.ui-form-item-group').find('.custom-tooltips-info');

                    if (isCapsLock) {
                        $infoTips.find('.validator-msg').html('键盘大写锁定已打开，请注意大小写');
                        if (!$infoTips.hasClass('z-ui-tooltips-in')) {
                            $infoTips.addClass('z-ui-tooltips-in');
                        }
                    }
                    else {
                        $infoTips.removeClass('z-ui-tooltips-in z-ui-tooltips-out');
                    }
                }
            }
        },
        configs: {
            mobileRegister: {
                rules: {
                    'loginName': {
                        'required': true,
                        'regex': /^[1][3,4,5,7,8][0-9]{9}$/,
                        'ajax': {
                            url: ctx + '/register/checkUserNameExistsOrBound',
                            cache: false,
                            type: 'POST',
                            data: {
                                'loginName': function() {
                                    return $.trim($('#J_mobile_name').val());
                                }
                            },
                            callback: function(data) {
                                return registerForm.data.checkUserName(data, 0, registerForm.controls.moForm);
                            }
                        }
                    },
                    'password': {
                        'required': true,
                        'checkpwd': true
                    },
                    'confirmPassword': {
                        'required': true,
                        'equalTo': '#J_mobile_pwd'
                    },
                    'pvcode': {
                        'required': true,
                        'regex': /^\d{6}$/
                    },
                    'agree': {
                        'required': true
                    }
                },
                messages: {
                    'loginName': {
                        'required': '手机号不能为空',
                        'regex': '请输入正确的手机号码'
                    },
                    'password': {
                        'required': '密码不能为空'
                    },
                    'confirmPassword': {
                        'required': '请输入确认密码',
                        'equalTo': '两次输入的密码不一致，请重试'
                    },
                    'pvcode': {
                        'required': '请输入6位数字手机验证码',
                        'regex': '请输入6位数字手机验证码'
                    },
                    'agree': {
                        'required': '接受服务条款才能注册'
                    }
                },
                infos: {
                    'loginName': '请输入您的11位手机号码',
                    'password': '密码由6-20位字母，数字和符号至少两种以上字符组合，区分大小写'
                },
                oninvalid: {
                    'loginName': function() {
                        registerForm.sms.setSmsButtonStatus(registerForm.controls.moForm, false);
                    }
                },
                onsubmit: function() {
                    var channel, bindToken;
                    var url, formData, isAgreeChecked, agree;

                    var $agreeChecked = registerForm.controls.moAgree.filter(':checked');


                    if ($agreeChecked.length > 0) {
                        isAgreeChecked = true;
                        agree = $agreeChecked.val();
                    }
                    else {
                        isAgreeChecked = false;
                    }

                    formData = {
                        'loginName': $.trim(registerForm.controls.moMobile.val()),
                        'password': md5_crypto.hex_md5(registerForm.controls.moPassword.val()),
                        'pvssid': registerForm.controls.moMobile.data('pvssid'),
                        'pvcode': $.trim(registerForm.controls.moCode.val())
                    };



                    if (isAgreeChecked) {
                        formData['agree'] = agree;
                    }

                    // 第三方注册绑定
                    if (isThirdLogin) {
                        channel = registerForm.controls.thirdChannel.val();
                        bindToken = registerForm.controls.bindToken.val();

                        url = ctx + '/binding/' + channel + '/mobile?v=' + Math.random();
                        formData['bind_token'] = bindToken;
                    }
                    else {
                        url = ctx + '/register/phone?v=' + Math.random();
                    }

                    if (registerForm.controls.successCode.length > 0) {
                        formData['SUCCESS_CODE'] = registerForm.controls.successCode.val();
                    }

                    // 隐藏custom tips
                    registerForm.controls.moForm.find('.custom-tooltips-info').removeClass('z-ui-tooltips-in z-ui-tooltips-out');

                    $.post(url, formData, function(data) {
                            var $el, $warningTips, tempHtml;

                            if (typeof(data.result) !== 'undefined' && data.result === 'haslogin') {
                                if (clsoseMessenger()) {
                                    return false;
                                }
                                redirect2Src();
                                return;
                            }
                            if (typeof(data.result) !== 'undefined' && data.result === 'error') {
                                // 系统级错误
                                if (data.errorCode === 10 || data.errorCode === 11) {
                                    registerForm.showSystemErrorTips(registerForm.configs.mobileFormErrorCode[data.errorCode]);
                                }
                                else {
                                    $el = $(registerForm.configs.mobileFormErrorCode[data.errorCode][0]);
                                    tempHtml = registerForm.configs.mobileFormErrorCode[data.errorCode][1];
                                    tempHtml = registerForm.data.addSeedForTipsLoginLink(data.errorCode, tempHtml, 0);

                                    // 显示错误
                                    registerForm.mobileValidation.showError($el, tempHtml);
                                }
                            }
                            else if (typeof(data.result) !== 'undefined' && data.result === 'success') {
                                registerForm.callb2c(data.data.signedApiUrl);
                            }
                            else {
                                registerForm.showSystemErrorTips('请求失败，请刷新页面重试');
                            }
                        }, 'json')
                        .done(function() {
                            registerForm.controls.moRegBtn.removeClass('z-ui-btn-loading');
                        });
                }
            },
            emailRegister: {
                rules: {
                    'loginName': {
                        'required': true,
                        'regex': /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/,
                        'ajax': {
                            url: ctx + '/register/checkUserNameExistsOrBound',
                            type: 'POST',
                            data: {
                                'loginName': function() {
                                    return $.trim($('#J_email_name').val());
                                },
                                'anticache': new Date().getTime()
                            },
                            callback: function(data) {
                                return registerForm.data.checkUserName(data, 1);
                            }
                        }
                    },
                    'password': {
                        'required': true,
                        'checkpwd': true
                    },
                    'confirmPassword': {
                        'required': true,
                        'equalTo': '#J_email_pwd'
                    },
                    'verified': {
                        'required': true,
                        'regex': /^[1][3,4,5,7,8][0-9]{9}$/,
                        'ajax': {
                            url: ctx + '/register/checkUserNameExistsOrBound',
                            type: 'POST',
                            data: {
                                'loginName': function() {
                                    return $.trim(registerForm.controls.emMobile.val());
                                },
                                'anticache': new Date().getTime()
                            },
                            callback: function(data) {
                                return registerForm.data.checkUserName(data, 0, registerForm.controls.emForm);
                            }
                        }
                    },
                    'pvcode': {
                        'required': true,
                        'regex': /^\d{6}$/
                    },
                    'agree': {
                        'required': true
                    }
                },
                messages: {
                    'loginName': {
                        'required': '邮箱账号不能为空',
                        'regex': '请输入正确的邮箱账号'
                    },
                    'password': {
                        'required': '密码不能为空'
                    },
                    'confirmPassword': {
                        'required': '请输入确认密码',
                        'equalTo': '两次输入的密码不一致，请重试'
                    },
                    'verified': {
                        'required': '手机号不能为空',
                        'regex': '请输入正确的手机号码'
                    },
                    'pvcode': {
                        'required': '请输入6位数字手机验证码',
                        'regex': '请输入6位数字手机验证码'
                    },
                    'agree': {
                        'required': '接受服务条款才能注册'
                    }
                },
                infos: {
                    'loginName': '请输入您的邮箱账号',
                    'verified': '请输入您的11位手机号码',
                    'password': '密码由6-20位字母，数字和符号至少两种以上字符组合，区分大小写'
                },
                oninvalid: {
                    'verified': function() {
                        registerForm.sms.setSmsButtonStatus(registerForm.controls.emForm, false);
                    }
                },
                onsubmit: function() {
                    var channel, bindToken;
                    var url, formData, isAgreeChecked, agree;
                    var redirectSrc = getQueryStringByName('src');

                    var $agreeChecked = registerForm.controls.emAgree.filter(':checked');



                    if ($agreeChecked.length > 0) {
                        isAgreeChecked = true;
                        agree = $agreeChecked.val();
                    }
                    else {
                        isAgreeChecked = false;
                    }

                    formData = {
                        'loginName': $.trim(registerForm.controls.emName.val()),
                        'password': md5_crypto.hex_md5(registerForm.controls.emPassword.val()),
                        'verified': $.trim(registerForm.controls.emMobile.val()),
                        'pvssid': registerForm.controls.emMobile.data('pvssid'),
                        'pvcode': $.trim(registerForm.controls.emCode.val()),
                        'pageSource': registerForm.pageSource
                    };


                    if (isAgreeChecked) {
                        formData['agree'] = agree;
                    }

                    // 第三方注册绑定
                    if (isThirdLogin) {
                        channel = registerForm.controls.thirdChannel.val();
                        bindToken = registerForm.controls.bindToken.val();

                        url = ctx + '/binding/' + channel + '/email?v=' + Math.random();
                        formData['bind_token'] = bindToken;
                    }
                    else {
                        url = ctx + '/register/mail?v=' + Math.random();
                    }

                    if (registerForm.controls.successCode.length > 0) {
                        formData['SUCCESS_CODE'] = registerForm.controls.successCode.val();
                    }

                    // 记录来源页
                    if (redirectSrc) {
                        formData['redirectSrc'] = redirectSrc;
                    }

                    // 隐藏custom tips
                    registerForm.controls.emForm.find('.custom-tooltips-info').removeClass('z-ui-tooltips-in z-ui-tooltips-out');

                    $.post(url, formData, function(data) {
                            var $el, $warningTips, tempHtml;

                            if (typeof(data.result) !== 'undefined' && data.result === 'error') {
                                // 系统级错误
                                if (data.errorCode === 10 || data.errorCode === 11) {
                                    registerForm.showSystemErrorTips(registerForm.configs.emailFormErrorCode[data.errorCode]);
                                }
                                else {
                                    $el = $(registerForm.configs.emailFormErrorCode[data.errorCode][0]);
                                    tempHtml = registerForm.configs.emailFormErrorCode[data.errorCode][1];
                                    tempHtml = registerForm.data.addSeedForTipsLoginLink(data.errorCode, tempHtml, 1);

                                    // 显示错误
                                    registerForm.emailValidation.showError($el, tempHtml);
                                }
                            }
                            else if (typeof(data.result) != 'undefined' && data.result == 'success') {
                                if (isThirdLogin && registerForm.controls.successCode.val() === '2') {
                                    registerForm.callb2c(data.data.signedApiUrl);
                                }
                                else {
                                    registerForm.sms.stopCountdown(registerForm.controls.emForm);
                                    registerForm.floating.open();
                                }
                            }
                            else {
                                registerForm.showSystemErrorTips('请求失败，请刷新页面重试');
                            }
                        }, 'json')
                        .done(function() {
                            registerForm.controls.emRegBtn.removeClass('z-ui-btn-loading');
                        });
                }
            },

            smsErrorCode: {
                22001: '该手机获取验证码已达上限，请隔日重试',
                20205: '该手机获取验证码已达上限，请隔日重试',
                22101: '手机号码输入错误，无法获取验证码'
            },
            smsInfoTips: {
                '3': '校验码已发出，请注意查收短信，今日还可获取<span class="f-pink">2次</span>验证码',
                '2': '校验码已发出，请注意查收短信，今日还可获取<span class="f-pink">1次</span>验证码',
                '1': '校验码已发出，请注意查收短信，今日获取次数已达上限',
                'other': '验证码已发送，请查收短信',
                'exceedLimited': '该手机获取验证码已达上限，请隔日重试',
                'occurError': '获取验证码失败，请重试'
            },
            mobileFormErrorCode: {
                1: ['#J_mobile_agree', '未同意注册协议'],
                2: ['#J_mobile_name', '手机号不能为空'],
                3: ['#J_mobile_name', '请输入正确的手机号码'],
                4: ['#J_mobile_man', '请选择性别'],
                5: ['#J_mobile_pwd', '密码不能为空'],
                6: ['#J_mobile_pwd', '密码需要md5加密传输'],
                9: ['#J_mobile_name', '该手机号已被注册，请更换，或<a href="https://passport.vip.com/login{0}" class="reg-link-blue">立即登陆</a>'],
                10: '系统发生错误，请重试',
                11: '已超过注册限制，请隔日重试',
                14: ['#J_mobile_name', '该手机号已绑定其他账号，请更换'],
                21: ['#J_mobile_code', '没有进行手机验证'],
                22: ['#J_mobile_code', '没有手机验证码'],
                23: ['#J_mobile_code', '验证码错误'],
                24: ['#J_mobile_code', '验证码过期'],
                25: ['#J_mobile_code', '验证码输入错误超过次数限制'],
                26: ['#J_mobile_code', '手机号和验证码不匹配']
            },
            emailFormErrorCode: {
                1: ['#J_email_agree', '未同意注册协议'],
                2: ['#J_email_name', '邮箱账号不能为空'],
                3: ['#J_email_name', '请输入正确的邮箱账号'],
                4: ['#J_email_man', '请选择性别'],
                5: ['#J_email_pwd', '密码不能为空'],
                6: ['#J_email_pwd', '密码需要md5加密传输'],
                9: ['#J_email_name', '该邮箱账号已被注册，请更换，或<a href="https://passport.vip.com/login{0}" class="reg-link-blue">立即登陆</a>'],
                10: '系统发生错误，请重试',
                11: '已超过注册限制，请隔日重试',
                12: ['#J_email_name', '邮箱账号没有激活'],
                14: ['#J_email_mobile', '该手机号已绑定其他账号，请更换'],
                15: ['#J_email_name', '邮箱账号已被绑定'],
                16: ['#J_email_name', '超过单个邮箱每日最大邮件发送次数'],
                17: ['#J_email_mobile', '请输入正确的手机号码'],
                21: ['#J_email_code', '没有进行手机验证'],
                22: ['#J_email_code', '没有手机验证码'],
                23: ['#J_email_code', '验证码错误'],
                24: ['#J_email_code', '验证码过期'],
                25: ['#J_email_code', '验证码输入错误超过次数限制'],
                26: ['#J_email_code', '手机号和验证码不匹配']
            },
            mobileCheckerErrorCode: {
                2: [false, '手机号不能为空'],
                9: [false, '该手机号已被注册，请更换，或<a href="https://passport.vip.com/login{0}" class="reg-link-blue">立即登陆</a>'], // 用户名已存在
                10: [false, '系统发生错误，请重试'],
                11: [false, '已超过注册限制，请隔日重试'],
                12: [false, '邮箱账号没有激活'],
                13: [false, '该手机号已绑定其他账号，请更换']
            },
            emailCheckerErrorCode: {
                2: [false, '邮箱账号不能为空'],
                9: [false, '该邮箱账号已被注册，请更换，或<a href="https://passport.vip.com/login{0}" class="reg-link-blue">立即登陆</a>'], // 用户名已存在
                10: [false, '系统发生错误，请重试'],
                11: [false, '已超过注册限制，请隔日重试'],
                12: [false, '邮箱账号没有激活'],
                13: [false, '该邮箱已绑定其他账号，请更换']
            },
            emailboxLogin: {
                'qq.com': 'http://mail.qq.com',
                'gmail.com': 'http://mail.google.com',
                'sina.com': 'http://mail.sina.com.cn',
                '163.com': 'http://mail.163.com',
                '126.com': 'http://mail.126.com',
                'yeah.net': 'http://www.yeah.net/',
                'sohu.com': 'http://mail.sohu.com/',
                'tom.com': 'http://mail.tom.com/',
                'sogou.com': 'http://mail.sogou.com/',
                '139.com': 'http://mail.10086.cn/',
                'hotmail.com': 'http://www.hotmail.com',
                'live.com': 'http://login.live.com/',
                'live.cn': 'http://login.live.cn/',
                'live.com.cn': 'http://login.live.com.cn',
                '189.com': 'http://webmail16.189.cn/webmail/',
                'yahoo.com.cn': 'http://mail.cn.yahoo.com/',
                'yahoo.cn': 'http://mail.cn.yahoo.com/',
                'eyou.com': 'http://www.eyou.com/',
                '21cn.com': 'http://mail.21cn.com/',
                '188.com': 'http://www.188.com/',
                'foxmail.coom': 'http://www.foxmail.com'
            },
            // 按registerFormPageSourceType类型来添加登录tips的埋点
            tipsLoginSeed: {
                0: ['?ff=125|2|1|13', '?ff=125|2|2|17'],
                1: ['?ff=382|2|3|12', '?ff=382|2|3|28'],
                2: ['?ff=383|2|4|14'],
                3: ['?ff=384|2|5|19', '?ff=384|2|5|33']
            }
        }
    };


    // ad
    var template = function(tpl, values) {
        return tpl.replace(/\{\{\s*(.+?)\s*\}\}/g, function(m, v) {
            return values[v] || '';
        });
    }
    var ADS = {
        api: '//cmc.vip.com/ads/position?callback=?',
        /**
         * 初始化设置要获取的广告id
         * @method init
         * @params {Array} ids
         */
        init: function(ids) {
            this.ids = ids;
            return this;
        },
        /**
         * 获取广告接口数据
         * @method fetch
         * @param {Function} [cb] 回调函数
         */
        fetch: function(cb) {
            var that = this;
            $.getJSON(this.api, {
                type: this.ids.join(','),
                channelId: 0,
                warehouse: 0
            }, function(res) {
                that.render(res, cb);
            });
        },
        /**
         * 生成广告位数据，输出数据之后会触发一个`ads.rendered`事件
         * @method render
         * @param {Object} res
         * @param {Function} [cb] 回调函数
         */
        render: function(res, cb) {
            for (var k in res) {
                var items = res[k].items,
                    i, len = items.length
                    // 广告位ID，统一转换成小写，如ad115，用来寻找页面对应的广告位和模板
                    ,
                    slotName = k.toLowerCase()
                    // 对应广告位容器
                    ,
                    $slot = $('#J_' + slotName).empty()
                    // 对应广告位模板，如果没有指定，默认使用`#J_ad_tpl`里面的模板内容
                    ,
                    adTpl = $('#J_' + slotName + '_tpl').html() || $('#J_ad_tpl').html();

                for (i = 0; i < len; i++) {
                    var item = items[i];
                    var $item = $(template(adTpl, item));
                    if (!item.link) {
                        if ($item.is('a')) {
                            $item.removeAttr('href');
                        } else {
                            $item.find('a').removeAttr('href');
                        }
                    } else if (item.blank) {
                        if ($item.is('a')) {
                            $item.attr('target', '_blank');
                        } else {
                            $item.find('a').attr('target', '_blank');
                        }
                    }
                    $slot.append($item);
                }
            }
            if (cb && typeof cb === 'function') {
                cb();
            }
        }
    };

    $(function() {
        registerForm.init();
        var oHeadAD = $("#J_ad285");
        if (oHeadAD.length > 0) {
            ADS.init(['285']).fetch();
        }
    });
})(jQuery);
