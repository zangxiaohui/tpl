var PasswordRules = {
    letterPattern: /[a-zA-Z]+/,
    numbericPattern: /[0-9]+/,
    specialPattern : /[~!@#$%^&*()_+`\-=\[\]\\{}\|;':",\.\/<>\?]/,
    illegalPattern : /[^a-zA-Z0-9~!@#$%^&*()_+`\-=\[\]\\{}\|;':",\.\/<>\?]+/,
    validate: function(pwd) {
        var len = pwd.length;
        var result = {
            success: false,
            strength: 'w',
            message: ''
        };

        if (len < 6) {
        	result.message = '密码不能少于6位';
            return result;
        }

        var category = this.calcCharsCategory(pwd);
        if (category <= 1) {
        	result.message="请输入6-20位字母和数字,符号两种以上组合";
            return result;
        }
        
        if (category === 2) {
            if (len >= 6 && len <= 11) {
                result.success = true;
                result.strength = 'm';
            }
            else if (len > 11 && len <= 20) {
                result.success = true;
                result.strength = 's';
            }
            else {
                result.success = false;
                result.strength = 's';
            }
        }
        else {
            if (len >= 6 && len <= 9) {
                result.success = true;
                result.strength = 'm';
            }
            else if (len > 9 && len <= 20) {
                result.success = true;
                result.strength = 's';
            }
            else {
                result.success = false;
                result.strength = 's';
            }
        }  
        
        if (this.illegalPattern.test(pwd)){
        	result.success = false;
        	result.message = "密码中包含非法字符";
            result.strength = 'w';
        }

        return result;
    },
    calcCharsCategory: function(pwd) {
        var category = 0;

        if (this.letterPattern.test(pwd)) {
            category++;
        }

        if (this.numbericPattern.test(pwd)) {
            category++;
        }

        if (this.specialPattern.test(pwd)) {
            category++;
        }

        return category;
    }
}
