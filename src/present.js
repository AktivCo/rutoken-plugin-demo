function testUi(useConsole) {
    this.controls = new uiControls();
    this.console = $("#console");

    this.useConsole = (useConsole === undefined) ? false : useConsole;

    var header = '<div class="ui-widget-header ui-corner-all"></div>';
    var codeBlock = '<div id="code"><button id="code-button" class="button test-element">Показать код</button>' + '<div id="code-view"><pre class = "brush: js"></pre></div></div>';
    var runButton = '<button id="test-run" class="button test-element">Запустить тест</button>';

    $(".test").each(function (index) {
        if (!TestSuite[$(this).attr("id")]) return;
        var test = TestSuite[$(this).attr("id")];
        test.container = $(this);
        test.section = $(this).parent();

        $(this).html(header + codeBlock + $(this).html() + runButton);
        $(this).find(".ui-widget-header").text(test.description);

        $(this).find("#code-view > pre").text(test.runTest.toString());
        $(this).find("#test-run").click($.proxy(test.run, test));

        var code = $(this).find("#code");
        code.find("#code-button").toggle(function () {
            code.find("#code-view").show("Blind");
        }, function () {
            code.find("#code-view").hide("Blind");
        });
    });

    $(".button").button();
    SyntaxHighlighter.all();

    $("#section").tabs({
        select: function () {
            ui.console.empty();
        }
    });
}

function uiControls() {
    this.deviceList = $("#device-list");
    this.keyList = $("#key-list");
    this.certificateList = $("#cert-list");

    this.refreshDeviceListButton = $("#refresh-dev");
    this.refreshKeyListButton = $("#refresh-keys");
    this.refreshCertificateListButton = $("#refresh-certs");

    this.loginButton = $("#login");
    this.logoutButton = $("#logout");

    this.savePinButton = $("#save-pin");
    this.removePinButton = $("#remove-pin");

    this.pinInput = $("#device-pin");
}

uiControls.prototype = {
    deviceList: null,
    keyList: null,
    certificateList: null,

    refreshDeviceListButton: null,
    refreshKeyListButton: null,
    refreshCertificateListButton: null,
    loginButton: null,
    logoutButton: null,
    savePinButton: null,
    removePinButton: null,

    pinInput: null
};

testUi.prototype = {
    controls: null,
    console: null,
    useConsole: null,

    clear: function () {
        this.console.empty();
    },
    write: function (text) {
        var str = text.replace(/\n/g, "<br>");
        this.console.html(this.console.html() + str);
        this.console.scrollTop(this.console[0].scrollHeight);
    },
    writeln: function (text) {
        this.write(text + "\n");
    },

    pin: function () {
        return this.controls.pinInput.val();
    },

    device: function () {
        var deviceId = Number(this.controls.deviceList.val());
        if (isNaN(deviceId)) throw "Нет доступных устройств";
        return deviceId;
    },

    key: function () {
        return this.controls.keyList.val();
    },

    certificate: function () {
        if (this.controls.certificateList.val() == null) throw "Сертификат не выбран";
        return this.controls.certificateList.val();
    },

    addDevice: function (deviceId, label) {
        ui.controls.deviceList.append($("<option>", {
            'value': deviceId
        }).text(label));
    },

    clearDeviceList: function (message) {
        this.controls.deviceList.empty();
        if (message) this.controls.deviceList.append($("<option>").text(message));
    },

    addKey: function (keyId, label) {
        this.controls.keyList.append($("<option>", {
            'value': keyId
        }).text(label));
    },

    refreshKeyList: function (keys) {
        this.clearKeyList();
        if (keys.length != 0)
            for (var d in keys) this.addKey(keys[d]);
        else this.controls.keyList.append($("<option>").text("Ключи на устройстве отсутствуют"));
    },

    clearKeyList: function (message) {
        this.controls.keyList.empty();
        if (message) this.controls.keyList.append($("<option>").text(message));
    },

    addCertificate: function (handle, certificate, category) {
        var description = "";
        switch (category) {
        case plugin.CERT_CATEGORY_USER:
            description = "Пользовательский| ";
            break;
        case plugin.CERT_CATEGORY_CA:
            description = "Корневой| ";
            break;
        case plugin.CERT_CATEGORY_OTHER:
            description = "Другой| ";
            break;
        case plugin.CERT_CATEGORY_UNSPEC:
            description = "Не задана| ";
            break;
        }

        var subjectDNs = certificate.subject;
        var noSubject = true;
        for (c in subjectDNs) {
            if (subjectDNs[c]["rdn"] == "commonName" || subjectDNs[c]["rdn"] == "emailAddress") {
                noSubject = false;
                description += subjectDNs[c]["rdn"] + "=" + subjectDNs[c]["value"] + "|";
            }
        }
        if (noSubject) description += certificate.serialNumber;

        var title = "Serial number: " + certificate.serialNumber + "\n\nIssuer:\n\t";
        var issuerDNs = certificate.issuer;
        for (c in issuerDNs) {
            title += issuerDNs[c]["rdn"] + "=" + issuerDNs[c]["value"] + "\n\t";
        }

        this.controls.certificateList.append($("<option>", {
            'value': handle,
            'title': $.trim(title).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
        }).text(noSubject ? certificate.serialNumber : description));
    },

    clearCertificateList: function (message) {
        this.controls.certificateList.empty();
        if (message) this.controls.certificateList.append($("<option>").text(message));
    },

    getContent: function (container, index) {
        if (index === undefined)
            index = 0;
        var elements = container.find(".text-input, .input");
        return elements[index].value;
    },

    setContent: function (container, text) {
        return container.find(".text-output").val(text);
    },

    infoType: function () {
        var value = $(".radio-input:radio[name=device-info]:checked").val();
        switch (value) {
        case "model":
            return plugin.TOKEN_INFO_MODEL;
        case "reader":
            return plugin.TOKEN_INFO_READER;
        case "label":
            return plugin.TOKEN_INFO_LABEL;
        case "type":
            return plugin.TOKEN_INFO_DEVICE_TYPE;
        case "serial":
            return plugin.TOKEN_INFO_SERIAL;
        case "pin cache":
            return plugin.TOKEN_INFO_IS_PIN_CACHED;
        case "logged":
            return plugin.TOKEN_INFO_IS_LOGGED_IN;
	case "formats":
	    return plugin.TOKEN_INFO_FORMATS;
	case "features":
	    return plugin.TOKEN_INFO_FEATURES;
        }
    },

    certificateType: function () {
        var value = $(".radio-input:radio[name=certificate-category]:checked").val();
        switch (value) {
        case "user":
            return plugin.CERT_CATEGORY_USER;
        case "ca":
            return plugin.CERT_CATEGORY_CA;
        case "other":
            return plugin.CERT_CATEGORY_OTHER;
        }
    },

	hashType: function () {
        var value = $(".radio-input:radio[name=hash-type]:checked").val();
        switch (value) {
        case "3411_94":
            return plugin.HASH_TYPE_GOST3411_94;
        }
    },

    checkboxState: function (container, name) {
        return container.find("input:checkbox[name=" + name + "]:checked").val();
    },

    registerEvents: function () {
        this.controls.refreshDeviceListButton.click($.proxy(function () {
            try {
                plugin.enumerateDevices();
            } catch (error) {
                this.writeln(error.toString());
                this.clearDeviceList(error.toString());
            }
        }, this));

        this.controls.refreshKeyListButton.click($.proxy(function () {
            try {
                plugin.enumerateKeys();
            } catch (error) {
                this.writeln(error.toString());
                this.clearKeyList(error.toString());
            }
        }, this));

        this.controls.refreshCertificateListButton.click($.proxy(function () {
            try {
                plugin.enumerateCertificates();
            } catch (error) {
                this.writeln(error.toString());
                this.clearCertificateList(error.toString());
            }
        }, this));

        this.controls.loginButton.click($.proxy(function () {
            try {
                plugin.login();
            } catch (error) {
                this.writeln(error.toString());
            }
        }, this));

        this.controls.logoutButton.click($.proxy(function () {
            try {
                plugin.logout();
            } catch (error) {
                this.writeln(error.toString());
            }
        }, this));

        this.controls.savePinButton.click($.proxy(function () {
            try {
                plugin.savePin();
            } catch (error) {
                this.writeln(error.toString());
            }
        }, this));

        this.controls.removePinButton.click($.proxy(function () {
            try {
                plugin.removePin();
            } catch (error) {
                this.writeln(error.toString());
            }
        }, this));

        this.controls.deviceList.change($.proxy(function () {
            if (plugin.autoRefresh) {
                plugin.enumerateKeys();
                plugin.enumerateCertificates();
            } else {
                this.clearKeyList("Обновите список ключевых пар");
                this.clearCertificateList("Обновите список сертификатов");
            }
        }, this));
    },

    // TBD: enable/disable controls
    // disableDeviceList: function(message) {
    //     this.controls.deviceList.empty();
    //     if (message) this.controls.deviceList.append($("<option>").text(message));
    //     this.controls.deviceList.attr('disabled', true);
    //     this.disableKeyList(message);
    //     this.disableCertificateList(message);
    // },
    // disableKeyList: function(message) {
    //     this.controls.keyList.empty();
    //     if (message) this.controls.keyList.append($("<option>").text(message));
    //     this.controls.keyList.attr('disabled', true);
    // },
    // disableCertificateList: function(message) {
    //     this.controls.certificateList.empty();
    //     if (message) this.controls.certificateList.append($("<option>").text(message));
    //     this.controls.certificateList.attr('disabled', true);
    // },
    // disableKeyRefreshButton: function() {
    //     this.controls.refreshKeyListButton.attr('disabled', true);
    // },
    // disableCertificateRefresh: function(message) {
    //     this.controls.refreshCertificateListButton.attr('disabled', true);
    // },
    printError: function (code) {
        if (this.useConsole) {
            console.trace();
            //console.log(code);
            console.debug(arguments);
        }
        this.writeln("Ошибка: " + plugin.errorDescription[code] + "\n");
    },

    printResult: function (message) {
        if (this.useConsole) {
            console.trace();
            console.debug(arguments);
        }
        if (undefined === message) {
            this.writeln("Выполнен" + "\n");
            return;
        }
        if ($.isArray(message)) {
            if (message.length) this.writeln("Массив длиной(" + message.length + "): \n" + message.join("\n") + "\n");
            else this.writeln("<Пустой массив>");
            return;
        }
        if (Object.prototype.toString.call(message) === '[object Object]') {
            this.writeln(JSON.stringify(message, null, "\t") + "\n");
            return;
        }
        if (message === "") {
            this.writeln("<Пустая строка>" + "\n");
            return;
        }
        this.writeln(message + "\n");
    },

    getSubject: function () {
        var inputs = $("#cert-subject input");
        var subject = [];
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].value != "") {
                var dn = {
                    "rdn": inputs[i].id,
                    "value": inputs[i].value
                }
                subject.push(dn);
            }
        }
        return subject;
    },

    getExtensions: function () {
        var inputs = $("#cert-extensions input");
        var keyUsage = [];
        var extKeyUsage = [];
        var certificatePolicies = [];

        for (var i = 0; i < inputs.length; i++) {
            var checkbox = inputs[i];
            if (checkbox.checked) switch (checkbox.name) {
            case "cert-exts-keyusage":
                keyUsage.push(checkbox.value);
                break;
            case "cert-exts-extkeyusage":
                extKeyUsage.push(checkbox.value);
                break;
            case "cert-exts-policies":
                certificatePolicies.push(checkbox.value);
                break;
            }
        }

        var extensions = {
            "keyUsage": keyUsage,
            "extKeyUsage": extKeyUsage,
            "certificatePolicies": certificatePolicies
        };
        return extensions;
    },

    readFile: function (container, callback) {
        if (undefined === window.FileReader) {
            throw "Браузер не поддерживает объект FileReader";
        }
        var e = container.find("#sign-file")[0];
        if (e.files.length == 0) throw "Не выбран файл для подписи";
        var f = e.files[0];

        var r = new FileReader();
        r.readAsBinaryString(f);
        r.onloadend = function (event) {
            callback($.base64.encode(event.target.result));
        };
    }
}

function timedCallbackProxy(func, name) {
    return function() {
        console.timeEnd(name);
        func.apply(this, arguments);
    };
}

function timedProxy(pluginObject, name) {
    return function() {
        console.time(name);
        arguments[arguments.length - 2] = timedCallbackProxy(arguments[arguments.length - 2], name);
        arguments[arguments.length - 1] = timedCallbackProxy(arguments[arguments.length - 1], name);
        pluginObject[name].apply(pluginObject, arguments);
    };
}

function cryptoPlugin(pluginObject, noAutoRefresh) {
    this.autoRefresh = noAutoRefresh ? false : true;

    this.pluginObject = pluginObject;
    if (!this.pluginObject.valid) this.delayedReport("Error: couldn't get CryptopluginObject");

    for (var key in this.pluginObject) {
        if (this[key]) continue;

        if (typeof(this.pluginObject[key]) == "function") this[key] = timedProxy(this.pluginObject, key);
        else this[key] = this.pluginObject[key];
    }

    this.errorCodes = this.pluginObject.errorCodes;
    this.errorDescription[this.errorCodes.UNKNOWN_ERROR] = "Неизвестная ошибка";
    this.errorDescription[this.errorCodes.BAD_PARAMS] = "Неправильные параметры";
    this.errorDescription[this.errorCodes.NOT_ENOUGH_MEMORY] = "Недостаточно памяти";

    this.errorDescription[this.errorCodes.DEVICE_NOT_FOUND] = "Устройство не найдено";
    this.errorDescription[this.errorCodes.DEVICE_ERROR] = "Ошибка устройства";
    this.errorDescription[this.errorCodes.TOKEN_INVALID] = "Ошибка чтения/записи устройства. Возможно, устройство было извлечено. Попробуйте выполнить enumerate";

    this.errorDescription[this.errorCodes.CERTIFICATE_CATEGORY_BAD] = "Недопустимый тип сертификата";
    this.errorDescription[this.errorCodes.CERTIFICATE_EXISTS] = "Сертификат уже существует на устройстве";
    this.errorDescription[this.errorCodes.CERTIFICATE_NOT_FOUND] = "Сертификат не найден";
    this.errorDescription[this.errorCodes.CERTIFICATE_HASH_NOT_UNIQUE] = "Хэш сертификата не уникален";
    this.errorDescription[this.errorCodes.CA_CERTIFICATES_NOT_FOUND] = "Корневые сертификаты не найдены";
    this.errorDescription[this.errorCodes.CERTIFICATE_VERIFICATION_ERROR] = "Ошибка проверки сертификата";

    this.errorDescription[this.errorCodes.PKCS11_LOAD_FAILED] = "Не удалось загрузить PKCS#11 библиотеку";

    this.errorDescription[this.errorCodes.PIN_LENGTH_INVALID] = "Некорректная длина PIN-кода";
    this.errorDescription[this.errorCodes.PIN_INCORRECT] = "Некорректный PIN-код";
    this.errorDescription[this.errorCodes.PIN_LOCKED] = "PIN-код заблокирован";
    this.errorDescription[this.errorCodes.PIN_CHANGED] = "PIN-код был изменен";
    this.errorDescription[this.errorCodes.SESSION_INVALID] = "Состояние токена изменилось";
    this.errorDescription[this.errorCodes.USER_NOT_LOGGED_IN] = "Выполните вход на устройство";

    this.errorDescription[this.errorCodes.ATTRIBUTE_READ_ONLY] = "Свойство не может быть изменено";
    this.errorDescription[this.errorCodes.KEY_NOT_FOUND] = "Соответствующая сертификату ключевая пара не найдена";
    this.errorDescription[this.errorCodes.KEY_ID_NOT_UNIQUE] = "Идентификатор ключевой пары не уникален";
    this.errorDescription[this.errorCodes.KEY_LABEL_NOT_UNIQUE] = "Метка ключевой пары не уникальна";
    this.errorDescription[this.errorCodes.WRONG_KEY_TYPE] = "Неправильный тип ключа";

    this.errorDescription[this.errorCodes.DATA_INVALID] = "Неверные данные";
    this.errorDescription[this.errorCodes.UNSUPPORTED_BY_TOKEN] = "Операция не поддерживается токеном";
    this.errorDescription[this.errorCodes.KEY_FUNCTION_NOT_PERMITTED] = "Операция запрещена для данного типа ключа";

    this.errorDescription[this.errorCodes.BASE64_DECODE_FAILED] = "Ошибка декодирования даных из BASE64";
    this.errorDescription[this.errorCodes.PEM_ERROR] = "Ошибка разбора PEM";
    this.errorDescription[this.errorCodes.ASN1_ERROR] = "Ошибка декодирования ASN1 структуры";

    this.errorDescription[this.errorCodes.FUNCTION_REJECTED] = "Операция отклонена пользователем";
    this.errorDescription[this.errorCodes.FUNCTION_FAILED] = "Невозможно выполнить операцию";

    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_ISSUER_CERT] = "Невозможно получить сертификат подписанта";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_CRL] = "Невозможно получить CRL";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_DECRYPT_CERT_SIGNATURE] = "Невозможно расшифровать подпись сертификата";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_DECRYPT_CRL_SIGNATURE] = "Невозможно расшифровать подпись CRL";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY] = "Невозможно раскодировать открытый ключ эмитента";
    this.errorDescription[this.errorCodes.X509_CERT_SIGNATURE_FAILURE] = "Неверная подпись сертификата";
    this.errorDescription[this.errorCodes.X509_CRL_SIGNATURE_FAILURE] = "Неверная подпись CRL";
    this.errorDescription[this.errorCodes.X509_CERT_NOT_YET_VALID] = "Срок действия сертификата еще не начался";
    this.errorDescription[this.errorCodes.X509_CRL_NOT_YET_VALID] = "Срок действия CRL еще не начался";
    this.errorDescription[this.errorCodes.X509_CERT_HAS_EXPIRED] = "Срок действия сертификата истек";
    this.errorDescription[this.errorCodes.X509_CRL_HAS_EXPIRED] = "Срок действия CRL истек";
    this.errorDescription[this.errorCodes.X509_ERROR_IN_CERT_NOT_BEFORE_FIELD] = "Некорректные данные в поле \"notBefore\" у сертификата";
    this.errorDescription[this.errorCodes.X509_ERROR_IN_CERT_NOT_AFTER_FIELD] = "Некорректные данные в поле \"notAfter\" у сертификата";
    this.errorDescription[this.errorCodes.X509_ERROR_IN_CRL_LAST_UPDATE_FIELD] = "Некорректные данные в поле \"lastUpdate\" у CRL";
    this.errorDescription[this.errorCodes.X509_ERROR_IN_CRL_NEXT_UPDATE_FIELD] = "Некорректные данные в поле \"nextUpdate\" у CRL";
    this.errorDescription[this.errorCodes.X509_OUT_OF_MEM] = "Нехватает памяти";
    this.errorDescription[this.errorCodes.X509_DEPTH_ZERO_SELF_SIGNED_CERT] = "Недоверенный самоподписанный сертификат";
    this.errorDescription[this.errorCodes.X509_SELF_SIGNED_CERT_IN_CHAIN] = "В цепочке обнаружен недоверенный самоподписанный сертификат";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_ISSUER_CERT_LOCALLY] = "Невозможно получить локальный сертификат подписанта";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_VERIFY_LEAF_SIGNATURE] = "Невозможно проверить первый сертификат";
    this.errorDescription[this.errorCodes.X509_CERT_CHAIN_TOO_LONG] = "Слишком длинная цепочка сертификатов";
    this.errorDescription[this.errorCodes.X509_CERT_REVOKED] = "Сертификат отозван";
    this.errorDescription[this.errorCodes.X509_INVALID_CA] = "Неверный корневой сертификат";
    this.errorDescription[this.errorCodes.X509_INVALID_NON_CA] = "Неверный некорневой сертфикат, помеченный как корневой";
    this.errorDescription[this.errorCodes.X509_PATH_LENGTH_EXCEEDED] = "Превышена длина пути";
    this.errorDescription[this.errorCodes.X509_PROXY_PATH_LENGTH_EXCEEDED] = "Превышина длина пути прокси";
    this.errorDescription[this.errorCodes.X509_PROXY_CERTIFICATES_NOT_ALLOWED] = "Проксирующие сертификаты недопустимы";
    this.errorDescription[this.errorCodes.X509_INVALID_PURPOSE] = "Неподдерживаемое назначение сертификата";
    this.errorDescription[this.errorCodes.X509_CERT_UNTRUSTED] = "Недоверенный сертификат";
    this.errorDescription[this.errorCodes.X509_CERT_REJECTED] = "Сертифкат отклонен";
    this.errorDescription[this.errorCodes.X509_APPLICATION_VERIFICATION] = "Ошибка проверки приложения";
    this.errorDescription[this.errorCodes.X509_SUBJECT_ISSUER_MISMATCH] = "Несовпадения субьекта и эмитента";
    this.errorDescription[this.errorCodes.X509_AKID_SKID_MISMATCH] = "Несовпадение идентификатора ключа у субьекта и доверенного центра";
    this.errorDescription[this.errorCodes.X509_AKID_ISSUER_SERIAL_MISMATCH] = "Несовпадение серийного номера субьекта и доверенного центра";
    this.errorDescription[this.errorCodes.X509_KEYUSAGE_NO_CERTSIGN] = "Ключ не может быть использован для подписи сертификатов";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_CRL_ISSUER] = "Невозможно получить CRL подписанта";
    this.errorDescription[this.errorCodes.X509_UNHANDLED_CRITICAL_EXTENSION] = "Неподдерживаемое расширение";
    this.errorDescription[this.errorCodes.X509_KEYUSAGE_NO_CRL_SIGN] = "Ключ не может быть использован для подписи CRL";
    this.errorDescription[this.errorCodes.X509_KEYUSAGE_NO_DIGITAL_SIGNATURE] = "Ключ не может быть использован для цифровой подписи";
    this.errorDescription[this.errorCodes.X509_UNHANDLED_CRITICAL_CRL_EXTENSION] = "Неподдерживаемое расширение CRL";
    this.errorDescription[this.errorCodes.X509_INVALID_EXTENSION] = "Неверное или некорректное расширение сертификата";
    this.errorDescription[this.errorCodes.X509_INVALID_POLICY_EXTENSION] = "Неверное или некорректное расширение политик сертификата";
    this.errorDescription[this.errorCodes.X509_NO_EXPLICIT_POLICY] = "Явные политики отсутствуют";
    this.errorDescription[this.errorCodes.X509_DIFFERENT_CRL_SCOPE] = "Другая область CRL";
    this.errorDescription[this.errorCodes.X509_UNSUPPORTED_EXTENSION_FEATURE] = "Неподдерживаемое расширение возможностей";
    this.errorDescription[this.errorCodes.X509_UNNESTED_RESOURCE] = "RFC 3779 неправильное наследование ресурсов";
    this.errorDescription[this.errorCodes.X509_PERMITTED_VIOLATION] = "Неправильная структура сертифката";
    this.errorDescription[this.errorCodes.X509_EXCLUDED_VIOLATION] = "Неправильная структура сертфиката";
    this.errorDescription[this.errorCodes.X509_SUBTREE_MINMAX] = "Неправильная структура сертифката";
    this.errorDescription[this.errorCodes.X509_UNSUPPORTED_CONSTRAINT_TYPE] = "Неправильная структура сертфиката";
    this.errorDescription[this.errorCodes.X509_UNSUPPORTED_CONSTRAINT_SYNTAX] = "Неправильная структура сертифката";
    this.errorDescription[this.errorCodes.X509_UNSUPPORTED_NAME_SYNTAX] = "Неправильная структура сертфиката";
    this.errorDescription[this.errorCodes.X509_CRL_PATH_VALIDATION_ERROR] = "Неправильный путь CRL";

    if (this.autoRefresh) this.enumerateDevices();
}

cryptoPlugin.prototype = {
    pluginObject: null,
    errorCodes: null,
    errorDescription: [],
    methods: null,
    constants: null,
    autoRefresh: null,

    delayedReport: function (message) {
        setTimeout(function () {
            ui.writeln(message + "\n");
        }, 0);
    },

    enumerateDevices: function () {
        ui.clearDeviceList("Список устройств обновляется...");
        this.pluginObject.enumerateDevices($.proxy(function (devices) {
            if (devices.length == 0) {
                ui.clearDeviceList("Нет доступных устройств");
                ui.clearCertificateList("Нет доступных устройств");
                ui.clearKeyList("Нет доступных устройств");
                return;
            }
            //            ui.clearKeyList("Выполните вход на устройство");
            ui.clearDeviceList();
            if (this.autoRefresh) this.enumerateKeys(devices[0]);
            if (this.autoRefresh) this.enumerateCertificates(devices[0]);
            else ui.clearCertificateList("Обновите список сертификатов");

            for (var d in devices) {
                this.pluginObject.getDeviceInfo(devices[d], plugin.TOKEN_INFO_LABEL, $.proxy(function (device) {
                    return function (label) {
                        if (label == "Rutoken ECP <no label>") label = "Rutoken ECP #" + device.toString();
                        ui.addDevice(device, label);
                    };
                }(devices[d]), this), $.proxy(ui.printError, ui));
            }
        }, this), $.proxy(ui.printError, ui));
    },

    enumerateKeys: function (deviceId, marker) {
        ui.clearKeyList("Список ключевых пар обновляется...");
        marker = (marker === undefined) ? "" : marker;
        deviceId = (deviceId === undefined) ? ui.device() : deviceId;
        this.pluginObject.enumerateKeys(deviceId, marker, $.proxy(function (keys) {
            if (keys.length == 0) {
                ui.clearKeyList("На устройстве отсутствуют ключевые пары");
                return;
            }

            ui.clearKeyList();
            for (var k in keys) {
                this.pluginObject.getKeyLabel(deviceId, keys[k], function (key) {
                    return function (label) {
                        if (label == "") label = "key: " + key.toString();
                        ui.addKey(key, label);
                    };
                }(keys[k]), $.proxy(ui.printError, ui));
            }
        }, this), function (errorCode) {
            if (errorCode == plugin.errorCodes.USER_NOT_LOGGED_IN) ui.clearKeyList(plugin.errorDescription[errorCode]);
            else $.proxy(ui.printError, ui)(errorCode);
        });
    },

    enumerateCertificates: function (deviceId) {
        function onError(errorCode) {
            $.proxy(ui.printError, ui)(errorCode);
            ui.clearCertificateList("Произошла ошибка");
        }

        function addCertificates(certificates, category) {
            for (var c in certificates) {
                this.pluginObject.parseCertificate(device, certificates[c], function (handle) {
                    return function (cert) {
                        ui.addCertificate(handle, cert, category);
                    }
                }(certificates[c]), $.proxy(ui.printError, ui));
            }

        }

        ui.clearCertificateList("Список сертификатов обновляется...");
        var device = (deviceId === undefined) ? ui.device() : deviceId;
        try {
            this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_USER, $.proxy(function (certificates) {
                ui.clearCertificateList();
                $.proxy(addCertificates, this)(certificates, this.CERT_CATEGORY_USER);

                this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_CA, $.proxy(function (certificates) {
                    $.proxy(addCertificates, this)(certificates, this.CERT_CATEGORY_CA);

                    this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_OTHER, $.proxy(function (certificates) {
                        $.proxy(addCertificates, this)(certificates, this.CERT_CATEGORY_OTHER);

                        this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_UNSPEC, $.proxy(function (certificates) {
                            $.proxy(addCertificates, this)(certificates, this.CERT_CATEGORY_UNSPEC);

                        }, this), onError);
                    }, this), onError);
                }, this), onError);
            }, this), onError);
        } catch (e) {
            // ui now throws an exception if there is no devices avalable
            console.log(e);
        }
    },

    login: function () {
        loginSucceeded = function () {
            ui.writeln("Вход выполнен\n");
            if (this.autoRefresh) this.enumerateKeys();
            else ui.clearKeyList("Обновите список ключевых пар");
        }

        this.pluginObject.login(ui.device(), ui.pin(), $.proxy(loginSucceeded, this), $.proxy(ui.printError, ui));
    },

    logout: function () {
        isLoggedIn = function (result) {
            if (!result) ui.clearKeyList("Выполните вход на устройство");
        }

        logoutSucceeded = function () {
            ui.writeln("Выход выполнен\n");
            plugin.pluginObject.getDeviceInfo(ui.device(), plugin.TOKEN_INFO_IS_LOGGED_IN,
                isLoggedIn, $.proxy(ui.printError, ui));
        }

        this.pluginObject.logout(ui.device(), $.proxy(logoutSucceeded, this), $.proxy(ui.printError, ui));
    },

    savePin: function () {
        savePinSucceeded = function () {
            ui.writeln("PIN сохранен в кэше\n");
        }

        this.pluginObject.savePin(ui.device(), $.proxy(savePinSucceeded, this), $.proxy(ui.printError, ui));
    },

    removePin: function () {
        removePinSucceeded = function () {
            ui.writeln("PIN удален из кэша\n");
            ui.clearKeyList("Выполните вход на устройство");
        }

        this.pluginObject.removePin(ui.device(), $.proxy(removePinSucceeded, this), $.proxy(ui.printError, ui));
    }
}

// ts begin
var TestSuite = new(function () {

    function Test() {
        this.run = function () {
            ui.writeln(this.description() + ":");
            try {
                this.runTest();
            } catch (e) {
                ui.writeln(e + "\n");
            }
        }
    };

    this.DevInfo = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение информации об устройстве";
        };
        this.runTest = function () {
            var info = ui.infoType();

                function successCallback(result) {
                    var message = result;

                    if (info === plugin.TOKEN_INFO_DEVICE_TYPE) {
                        message = "Невозможно определить тип устройства";
                        switch (result) {
                        case plugin.TOKEN_TYPE_UNKNOWN:
                            message = "Неизвестное устройство";
                            break;
                        case plugin.TOKEN_TYPE_KAZTOKEN:
                            message = "KazToken";
                            break;
                        case plugin.TOKEN_TYPE_RUTOKEN_ECP:
                            message = "Рутокен ЭЦП";
                            break;
                        case plugin.TOKEN_TYPE_RUTOKEN_WEB:
                            message = "Рутокен Web";
                            break;
                        case plugin.TOKEN_TYPE_RUTOKEN_PINPAD_2:
                            message = "Рутокен PINPad 2";
                            break;
                        case plugin.TOKEN_TYPE_RUTOKEN_ECP_SC:
                            message = "Рутокен ЭЦП SC";
                            break;
                        }
                    }

		    if (info == plugin.TOKEN_INFO_FORMATS) {
			var m = {};
			m[plugin.DEVICE_DATA_FORMAT_PLAIN] = "DEVICE_DATA_FORMAT_PLAIN";
			m[plugin.DEVICE_DATA_FORMAT_RAW] = "DEVICE_DATA_FORMAT_RAW";
			m[plugin.DEVICE_DATA_FORMAT_PINPAD2] = "DEVICE_DATA_FORMAT_PINPAD2";
			m[plugin.DEVICE_DATA_FORMAT_XML] = "DEVICE_DATA_FORMAT_XML";
			m[plugin.DEVICE_DATA_FORMAT_SAFETOUCH] = "DEVICE_DATA_FORMAT_SAFETOUCH";

			message = "[" + result.map(function(value) {
			    return m[value];
			}).join(", ") + "]";
		    }

		    if (info == plugin.TOKEN_INFO_FEATURES) {
			message = JSON.stringify(result);
		    }
		    
                    message += " (" + info + ")";
                    ui.printResult(message);
                }
            plugin.getDeviceInfo(ui.device(), ui.infoType(), successCallback, $.proxy(ui.printError, ui));
        };
    })();

    this.ChangePin = new(function () {
        Test.call(this);
        this.description = function () {
            return "Смена ПИНа пользователя";
        };
        this.runTest = function () {
            var options = {};
            plugin.changePin(ui.device(), ui.getContent(this.container, 0),  ui.getContent(this.container, 1), options, $.proxy(function () {
                $.proxy(ui.printResult, ui)();
            }, this), $.proxy(ui.printError, ui));
        }
    })();

    this.ChangePin2 = new(function () {
        Test.call(this);
        this.description = function () {
            return "Смена ПИН2";
        };
        this.runTest = function () {
            var options = {};
            plugin.pluginObject.changePin(ui.device(), null,  null, options, $.proxy(function () {
                $.proxy(ui.printResult, ui)();
            }, this), $.proxy(ui.printError, ui));
        }
    })();

    this.FormatToken = new(function () {
        Test.call(this);
        this.description = function () {
            return "Форматирование токена";
        };

        this.runTest = function () {
            var options = {};
            var adminPin = ui.getContent(this.container, 0);
            if (adminPin) options.adminPin = adminPin;
            var newUserPin = ui.getContent(this.container, 1);
            if (newUserPin) options.newUserPin = newUserPin;
            var label = ui.getContent(this.container, 2);
            if (label) options.label = label;

            plugin.formatToken(ui.device(), options, $.proxy(function () {
                $.proxy(ui.printResult, ui)();
            }, this), $.proxy(ui.printError, ui));
        }
    })();

    this.GenerateKeyPair = new(function () {
        Test.call(this);
        this.description = function () {
            return "Генерация ключевой пары ГОСТ Р 34.10-2001 с указанным маркером на устройстве";
        };
        this.runTest = function () {
            var options = {};
            if (ui.checkboxState(this.container, "need-pin") == "on") options.needPin = true;
            if (ui.checkboxState(this.container, "need-confirm") == "on") options.needConfirm = true;
            if (ui.checkboxState(this.container, "journal") == "on") options.keyType = plugin.KEY_TYPE_JOURNAL;
            options.id = ui.getContent(this.container, 4);
            plugin.generateKeyPair(ui.device(), "A", ui.getContent(this.container, 3), options, $.proxy(function () {
                $.proxy(ui.printResult, ui)();
                if (plugin.autoRefresh) plugin.enumerateKeys();
                else ui.clearKeyList("Обновите список ключевых пар");
            }, this), $.proxy(ui.printError, ui));
        }
    })();

    this.EnumerateKeys = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение списка ключевых пар на устройстве по маркеру";
        };
        this.runTest = function () {
            $.proxy(ui.writeln, ui)("Маркер: " + ui.getContent(this.container));
            plugin.enumerateKeys(ui.device(), ui.getContent(this.container), $.proxy(function (keys) {
                $.proxy(ui.printResult, ui)(keys);
            }, this), $.proxy(ui.printError, ui));
        }
    })();

    this.SetKeyLabel = new(function () {
        Test.call(this);
        this.description = function () {
            return "Установка метки ключевой пары";
        };
        this.runTest = function () {
            plugin.setKeyLabel(ui.device(), ui.key(), ui.getContent(this.container), $.proxy(function () {
                $.proxy(ui.printResult, ui)();
                if (plugin.autoRefresh) plugin.enumerateKeys();
                else ui.clearKeyList("Обновите список ключевых пар");
            }, this), $.proxy(ui.printError, ui));
        }
    })();

    this.GetKeyLabel = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение метки ключевой пары";
        };
        this.runTest = function () {
            plugin.getKeyLabel(ui.device(), ui.key(), $.proxy(ui.printResult, ui), $.proxy(ui.printError, ui));
        }
    })();

    this.GetPublicKey = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение открытого ключа ключевой пары";
        };
        var options = {};
        this.runTest = function () {
            plugin.getPublicKeyValue(ui.device(), ui.key(), options, $.proxy(ui.printResult, ui), $.proxy(ui.printError, ui));
        }
    })();

    this.DeleteKeyPair = new(function () {
        Test.call(this);
        this.description = function () {
            return "Удаление ключевой пары ГОСТ Р 34.10-2001 с устройства";
        };
        this.runTest = function () {
            plugin.deleteKeyPair(ui.device(), ui.key(), $.proxy(function () {
                $.proxy(ui.printResult, ui)();
                if (plugin.autoRefresh) plugin.enumerateKeys();
                else ui.clearKeyList("Обновите список ключевых пар");
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.GetJournal = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение журнала операций на токене";
        };
        this.runTest = function () {
            plugin.getJournal(ui.device(), ui.key(), {}, $.proxy(function (j) {
                if(j === null) $.proxy(ui.printResult, ui)();
                else {
                    $.proxy(ui.printResult, ui)(j);
                    ui.setContent(this.container, "journal: " + j.journal + "\nsignature: " + j.signature);
                }
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.CreatePkcs10 = new(function () {
        Test.call(this);
        this.description = function () {
            return "Формирование PKCS10 запроса";
        };
        this.runTest = function () {
            var includeSubjectSignToolExt = true;
            plugin.createPkcs10(ui.device(), ui.key(), ui.getSubject(), ui.getExtensions(), includeSubjectSignToolExt, $.proxy(function (res) {
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.ImportCertificate = new(function () {
        Test.call(this);
        this.description = function () {
            return "Импорт сертификата на устройство";
        };
        this.runTest = function () {
            plugin.importCertificate(ui.device(), ui.getContent(this.container), ui.certificateType(), $.proxy(function (certificateHandle) {
                if (plugin.autoRefresh) plugin.enumerateCertificates();
                else ui.clearCertificateList("Обновите список сертификатов");
                $.proxy(ui.printResult, ui)(certificateHandle);
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.DeleteCertificate = new(function () {
        Test.call(this);
        this.description = function () {
            return "Удаление сертификата";
        };
        this.runTest = function () {
            plugin.deleteCertificate(ui.device(), ui.certificate(), $.proxy(function () {
                $.proxy(ui.printResult, ui)();
                if (plugin.autoRefresh) plugin.enumerateCertificates();
                else ui.clearCertificateList("Обновите список сертификатов");
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.GetKeyByCertificate = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение ID ключевой пары по сертификату";
        };
        this.runTest = function () {
            plugin.getKeyByCertificate(ui.device(), ui.certificate(), $.proxy(function (keyId) {
                $.proxy(ui.printResult, ui)(keyId);
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.SignMessage = new(function () {
        Test.call(this);
        this.description = function () {
            return "Подпись сообщения";
        };

        this.runTest = function () {
            var options = {
                addSignTime: true,
            };
            ui.setContent(this.container, "");
            options.useHardwareHash = ui.checkboxState(this.container, "use-hw-hash") == "on" ? true : false;
            options.detached = ui.checkboxState(this.container, "detached-sign") == "on" ? true : false;
            options.addUserCertificate = ui.checkboxState(this.container, "add-user-cert") == "on" ? true : false;

            var isBase64 = false
            isBase64 = ui.checkboxState(this.container, "in-base64") == "on" ? true : false;

            if (ui.useConsole) {
                console.time("sign");
                console.log("HW", options.useHardwareHash);
                console.log("detached: ", options.detached);
                console.log("base64: ", isBase64);
            }
            plugin.sign(ui.device(), ui.certificate(), ui.getContent(this.container), isBase64, options, $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("sign");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

	this.CalcHash = new(function () {
        Test.call(this);
        this.description = function () {
            return "Вычислить хеш";
        };

        this.runTest = function () {
            var options = {};
            ui.setContent(this.container, "");
            options.useHardwareHash = ui.checkboxState(this.container, "use-hw-hash") == "on" ? true : false;
			
            if (ui.useConsole) {
                console.time("calc-hash");
                console.log("HW", options.useHardwareHash);                
            }
            plugin.digest(ui.device(), ui.hashType(), ui.getContent(this.container, 0), options, $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("calc-hash");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.SignHash = new(function () {
        Test.call(this);
        this.description = function () {
            return "Подпись на ключе";
        };

        this.runTest = function () {
            var options = {};
            ui.setContent(this.container, "");
            options.useHardwareHash = ui.checkboxState(this.container, "use-hw-hash") == "on" ? true : false;
            options.computeHash = ui.checkboxState(this.container, "compute-hash") == "on" ? true : false;
            options.invisible = ui.checkboxState(this.container, "invisible") == "on" ? true : false;

            if (ui.useConsole) {
                console.time("sign-hash");
                console.log("HW", options.useHardwareHash);
                console.log("detached: ", options.computeHash);
                console.log("invisible: ", options.invisible);
            }
            plugin.rawSign(ui.device(), ui.key(), ui.getContent(this.container, 0), options, $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("sign-hash");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.SignMessagePinPad = new(function () {
        Test.call(this);
        this.description = function () {
            return "Подпись сообщения на PINPad";
        };

        this.runTest = function () {
            var options = {
                detached: false,
                addUserCertificate: true,
                addSignTime: false
            };
            ui.setContent(this.container, "");
            options.useHardwareHash = ui.checkboxState(this.container, "use-hw-hash") == "on" ? true : false;
            options.invisible = ui.checkboxState(this.container, "invisible") == "on" ? true : false;
            options.detached = ui.checkboxState(this.container, "detached-sign") == "on" ? true : false;
            options.addUserCertificate = ui.checkboxState(this.container, "add-user-cert") == "on" ? true : false;

            if (ui.useConsole) {
                console.time("sign");
                console.log("invisible: ", options.invisible);
                console.log("detached: ", options.detached);
                console.log("user cert included: ", options.addUserCertificate);
            }
            plugin.sign(ui.device(), ui.certificate(), ui.getContent(this.container), false, options, $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("sign");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.SignXmlPinPad = new(function () {
        Test.call(this);
        this.description = function () {
            return "Подпись XML сообщения на PINPad";
        };

        this.runTest = function () {
            var options = {
                detached: false,
                addUserCertificate: true,
                addSignTime: false
            };
            ui.setContent(this.container, "");
            options.useHardwareHash = ui.checkboxState(this.container, "use-hw-hash") == "on" ? true : false;
            options.detached = ui.checkboxState(this.container, "detached-sign") == "on" ? true : false;
            options.addUserCertificate = ui.checkboxState(this.container, "add-user-cert") == "on" ? true : false;

            if (ui.useConsole) {
                console.time("sign");
                console.log("detached: ", options.detached);
                console.log("user cert included: ", options.addUserCertificate);
            }
            plugin.pluginObject.sign(ui.device(), ui.certificate(), ui.getContent(this.container), false, options, $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("sign");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.SignMessageSafeTouch = new(function () {
        Test.call(this);
        this.description = function () {
            return "Подпись сообщения на Safe Touch";
        };

        this.runTest = function () {
            var options = {
                detached: false,
                addUserCertificate: true,
                addSignTime: false,
                useHardwareHash: true
            };
            ui.setContent(this.container, "");
            options.detached = ui.checkboxState(this.container, "detached-sign") == "on" ? true : false;
            options.addUserCertificate = ui.checkboxState(this.container, "add-user-cert") == "on" ? true : false;

            var isBase64 = ui.checkboxState(this.container, "in-base64") == "on" ? true : false;

            if (ui.useConsole) {
                console.time("sign");
                console.log("detached: ", options.detached);
            }
            plugin.sign(ui.device(), ui.certificate(), ui.getContent(this.container), isBase64, options, $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("sign");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.Authenticate = new(function () {
        Test.call(this)
        this.description = function () {
            return "Аутентификация";
        }

        this.runTest = function () {
            ui.setContent(this.container, "");
            if (ui.useConsole) {
                console.time("authenticate");
            }
            plugin.authenticate(ui.device(), ui.certificate(), ui.getContent(this.container), $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("authenticate");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui))
        }
    });

    this.SignFile = new(function () {
        Test.call(this)
        this.description = function () {
            return "Подпись файла";
        }

        this.runTest = function () {
            var options = {
                detached: true,
                addUserCertificate: true
            }
            ui.readFile(this.container, $.proxy(function (data) {
                ui.setContent(this.container, "");
                plugin.sign(ui.device(), ui.certificate(), data, false, options, $.proxy(function (res) {
                    ui.setContent(this.container, res);
                    $.proxy(ui.printResult, ui)(res);
                }, this), $.proxy(ui.printError, ui))
            }, this))
        }
    });

    this.Verify = new(function () {
        Test.call(this)
        this.description = function () {
            return "Проверка подписи";
        }

        this.runTest = function () {
            var options = {
                base64: false,
                useHardwareVerify: false
            };
            options.useHardwareHash = ui.checkboxState(this.container, "use-hw-hash") == "on" ? true : false;
            options.verifyCertificate = ui.checkboxState(this.container, "verify-signer-cert") == "on" ? true : false;
            options.base64 = ui.checkboxState(this.container, "in-base64") == "on" ? true : false;
            options.data = ui.getContent(this.container, 1);

            var cert = ui.getContent(this.container, 2);
            if (cert != "") {
                options.certificates = new Array();
                options.certificates.push(cert);
            }

            var caCert = ui.getContent(this.container, 3);
            if (caCert != "") {
                options.CA = new Array();
                options.CA.push(caCert);
            }
            if (ui.useConsole) {
                console.log("useHardwareHash: ", options.useHardwareHash);
                console.log("verifyCertificate: ", options.verifyCertificate);
                console.log("data: ", options.data);
                console.log("certificates: ", options.certificates);
            }
            plugin.verify(ui.device(), ui.getContent(this.container, 0), options, $.proxy(ui.printResult, ui), $.proxy(ui.printError, ui))
        }
    });

    this.EncryptMessage = new(function () {
        Test.call(this);
        this.description = function () {
            return "Шифрование сообщения в формате CMS";
        };

        this.runTest = function () {
            ui.setContent(this.container, "");
            var hw = ui.checkboxState(this.container, "use-hw-encryption") == "on" ? true : false;
            var b64 = ui.checkboxState(this.container, "in-base64") == "on" ? true : false;
            var options = {
                useHardwareEncryption: hw,
                base64: b64
            };
            
            plugin.cmsEncrypt(ui.device(), "", ui.getContent(this.container, 0), ui.getContent(this.container, 1),
                options, $.proxy(function (res) {
                    if (ui.useConsole) {
                        console.timeEnd("encrypt");
                    }
                    ui.setContent(this.container, res);
                    $.proxy(ui.printResult, ui)(res);
                }, this), $.proxy(ui.printError, ui));
        }
    });

    this.DecryptMessage = new(function () {
        Test.call(this);
        this.description = function () {
            return "Расшифровывание сообщения в формате CMS";
        };

        this.runTest = function () {
            ui.setContent(this.container, "");
            var hw = ui.checkboxState(this.container, "use-hw-decryption") == "on" ? true : false;
            var options = {
                useHardwareDecryption: hw
            };
            plugin.cmsDecrypt(ui.device(), ui.key(), ui.getContent(this.container, 0), options, $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("decrypt");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.Encrypt = new(function () {
        Test.call(this);
        this.description = function () {
            return "Симметричное шифрование сообщения";
        };

        this.runTest = function () {
            ui.setContent(this.container, "");
            plugin.encrypt(ui.device(), ui.getContent(this.container, 0), ui.getContent(this.container, 1), $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("encryptSym");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.Decrypt = new(function () {
        Test.call(this);
        this.description = function () {
            return "Симметричное расшифрование сообщения";
        };

        this.runTest = function () {
            ui.setContent(this.container, "");
            plugin.decrypt(ui.device(), ui.getContent(this.container, 0), ui.getContent(this.container, 1), $.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("decryptSym");
                }
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.ParseCertificate = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение информации о выбранном сертификате";
        }
        this.runTest = function () {
            plugin.parseCertificate(ui.device(), ui.certificate(), $.proxy(function (res) {
                ui.setContent(this.container, res.text);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui))
        }
    })();

    this.GetCertificate = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение тела выбранного сертификата в base64";
        }
        this.runTest = function () {
            plugin.getCertificate(ui.device(), ui.certificate(), $.proxy(function (res) {
                ui.setContent(this.container, res);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui))
        }
    })();

    this.ParseCertificateFromString = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение информации о сертификате из строки";
        };
        this.runTest = function () {
            ui.setContent(this.container, "");
            plugin.parseCertificateFromString(ui.getContent(this.container), $.proxy(function (res) {
                ui.setContent(this.container, res.text);
                $.proxy(ui.printResult, ui)(res);
            }, this), $.proxy(ui.printError, ui))
        };
    })();
})();

function onPluginLoaded(pluginObject) {
    try {
        var noAutoRefresh = (document.location.search.indexOf("noauto") !== -1);
        var useConsole = (document.location.search.indexOf("log") !== -1);

        ui = new testUi(useConsole);
        plugin = new cryptoPlugin(pluginObject, noAutoRefresh);
        ui.registerEvents();
    } catch (error) {
        ui.writeln(error);
    }
}

window.onload = function () {
    rutoken.ready.then(function () {
        if (window.chrome) {
            return rutoken.isExtensionInstalled();
        } else {
            return Promise.resolve(true);
        }
    }).then(function (result) {
        if (result) {
            return rutoken.isPluginInstalled();
        } else {
            throw "Rutoken Extension wasn't found";
        }
    }).then(function (result) {
        if (result) {
            return rutoken.loadPlugin();
        } else {
            throw "Rutoken Plugin wasn't found";
        }
    }).then(function (plugin) {
        return plugin.wrapWithOldInterface();
    }).then(function (wrappedPlugin) {
        onPluginLoaded(wrappedPlugin);
    }).then(undefined, function (reason) {
        console.log(reason);
    });
}
