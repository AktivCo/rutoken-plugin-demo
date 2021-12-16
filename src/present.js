function testUi(useConsole) {
    this.controls = new uiControls();
    this.console = $("#console");

    this.useConsole = (useConsole === undefined) ? false : useConsole;

    var header = '<div class="group_header ui-widget-header ui-corner-all"></div>';
    var codeBlock = '<div id="code"><button id="code-button" class="example button test-element">Показать код</button>' + '<div id="code-view"><pre class="brush: js"></pre></div></div>';
    var runButton = '<button id="test-run" class="execute button test-element">Запустить тест</button>';

    $(".group").each(function (index) {
        if (!TestSuite[$(this).attr("id")]) return;
        var test = TestSuite[$(this).attr("id")];
        test.container = $(this);
        test.section = $(this).parent();

        $(this).html(header + codeBlock + $(this).html() + runButton);
        $(this).find(".group_header").text(test.description);

        $(this).find("#code-view > pre").text(test.runTest.toString());
        $(this).find("#test-run").click($.proxy(test.run, test));

        var code = $(this).find("#code");
        code.find("#code-button").toggle(function () {
            code.find("#code-view").show("Blind");
        }, function () {
            code.find("#code-view").hide("Blind");
        });
    });

    $("#add-custom-extension").click($.proxy(this.newCustomExtension, this));
    $("#add-new-recipient").click($.proxy(this.newCmsEncryptRecipient, this));
    $(".verify-add-signer").click($.proxy(this.newVerifySigner, this));

    $(".button").button();
    SyntaxHighlighter.highlight();

    $("#section").tabs({
        select: function () {
            ui.console.empty();
        }
    });

    document.getElementById("cms-rsa-hash").onclick = function() {
        document.getElementById("cms-hash-alg").disabled = !this.checked;
    }

    document.getElementById("cms-encrypt-cipher").onclick = function() {
        document.getElementById("cms-encrypt-alg").disabled = !this.checked;
    }

    document.getElementById("set-content-type").onclick = function() {
        document.getElementById("content-type").disabled = !this.checked;
    }

    $(document).on('change', '.public-key-algorithm', function(e) {
        if (this.options[e.target.selectedIndex].text != "RSA")
            document.getElementById("rsa-keygen-size").disabled = true;
        else
            document.getElementById("rsa-keygen-size").disabled = false;
    });

    document.getElementById("add-sign-attrs").onclick = function() {
        addSignAttrs = this.checked;

        if (addSignAttrs)
            $(document).find("#sign-attrs").show("Blind");
        else
            $(document).find("#sign-attrs").hide("Blind");

        document.getElementById("add-sign-time").disabled = true;
        document.getElementById("add-sign-time").checked = addSignAttrs;
        document.getElementById("add-system-info").checked = false;
        document.getElementById("add-security-products-info").checked = false;
        document.getElementById("add-ess-cert").checked = false;
        document.getElementById("set-content-type").checked = false;
        document.getElementById("content-type").disabled = true;
        document.getElementById("content-type").value = "1.3.6.1.5.5.7.12.2";
    }

    document.getElementById("add-ts-token").onclick = function() {
        addTst = this.checked;
        optionsContainer = $(document).find("#tsp-options");

        if (addTst)
            optionsContainer.show("Blind");
        else
            optionsContainer.hide("Blind");

        optionsContainer.find("#tsa-url").val("");
        optionsContainer.find("#ts-hash-alg").val("HASH_TYPE_GOST3411_12_256");
        optionsContainer.find("#tsa-cert-req")[0].checked = true;
        optionsContainer.find("#ts-nonce")[0].checked = true;
        optionsContainer.find("#ts-set-policy").val("");
        optionsContainer.find("#ts-ext-oid").val("");
        optionsContainer.find("#ts-ext-value").val("");
        optionsContainer.find("#ts-ext-crit")[0].checked = false;
        optionsContainer.find("#verify-ts-token")[0].checked = true;
        optionsContainer.find("#ts-ca-cert").val("");
        ui.clearVerifySigners(optionsContainer.find(".Certificates")[0]);
    }
}

function uiControls() {
    this.deviceList = $("#device-list");
    this.keyList = $("#key-list");
    this.certificateList = $("#cert-list");
    this.systemStoreCertificateList = $("#system-store-cert-list");

    this.refreshDeviceListButton = $("#refresh-dev");
    this.refreshKeyListButton = $("#refresh-keys");
    this.refreshCertificateListButton = $("#refresh-certs");
    this.refreshSystemStoreCertificateListButton = $("#refresh-system-store-certs");

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
    systemStoreCertificateList: null,

    refreshDeviceListButton: null,
    refreshKeyListButton: null,
    refreshCertificateListButton: null,
    refreshSystemStoreCertificateListButton: null,
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

    systemStoreCertificate: function () {
        if (this.controls.systemStoreCertificateList.val() == null) throw "Сертификат не выбран";
        return this.controls.systemStoreCertificateList.val();
    },

    addDevice: function (deviceId, label, selected) {
        selected = (selected === undefined) ? false : selected;
        ui.controls.deviceList.append($("<option>", {
            'value': deviceId,
            'selected': selected,
        }).text(label));
    },

    removeDevice: function (deviceId) {
        this.controls.deviceList.find("option[value='" + deviceId + "']").remove();
        if (!this.controls.deviceList.has('option').length) this.controls.deviceList.append($("<option>").text("Нет доступных устройств"));
    },

    removeInfoInDeviceList: function () {
        this.controls.deviceList.find('option:not([value])').remove();
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

    addSystemStoreCertificate: function (certificate) {
        this.controls.systemStoreCertificateList.append($("<option>", {
            'value': certificate,
            'title': "Store certificate"}).text(certificate));
    },

    clearCertificateList: function (message) {
        this.controls.certificateList.empty();
        if (message) this.controls.certificateList.append($("<option>").text(message));
    },

    clearSystemStoreCertificateList: function (message) {
        this.controls.systemStoreCertificateList.empty();
        if (message) this.controls.systemStoreCertificateList.append($("<option>").text(message));
    },

    getContent: function (container, index) {
        if (index === undefined)
            index = 0;
        var elements = container.find(".text-input, .input");
        return elements[index].value;
    },

    getArray: function (container, selector) {
        var elements = container.find(selector);

        var array = [];
        for (var i = 0; i < elements.length; i++)
            if (elements[i].value != "")
                array.push(elements[i].value);

        return array;
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
        case "logged":
            return plugin.TOKEN_INFO_IS_LOGGED_IN;
        case "formats":
            return plugin.TOKEN_INFO_FORMATS;
        case "features":
            return plugin.TOKEN_INFO_FEATURES;
        case "mechanisms":
            return plugin.TOKEN_INFO_SUPPORTED_MECHANISMS;
        case "speed":
            return plugin.TOKEN_INFO_SPEED;
        case "free memory":
            return plugin.TOKEN_INFO_FREE_MEMORY;
        case "pins":
            return plugin.TOKEN_INFO_PINS_INFO;
        case "fkn":
            return plugin.TOKEN_INFO_FKN_SUPPORTED;
        }
    },

    keyInfoType: function () {
        var value = $(".radio-input:radio[name=key-info]:checked").val();
        switch (value) {
        case "algorithm":
            return plugin.KEY_INFO_ALGORITHM;
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

    certificateInfoType: function () {
        var value = $(".radio-input:radio[name=certificate-info]:checked").val();
        switch (value) {
        case "serial number":
            return plugin.CERT_INFO_SERIAL_NUMBER;
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

        this.controls.refreshSystemStoreCertificateListButton.click($.proxy(function () {
            try {
                plugin.enumerateStoreCertificates();
            } catch (error) {
                this.writeln(error.toString());
                this.clearSystemStoreCertificateList(error.toString());
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
    printError: function (error) {
        if (this.useConsole) {
            console.trace();
            console.debug(arguments);
        }
        let errorCode = getErrorCode(error);
        if (plugin.errorDescription[errorCode] === undefined)
        {
            this.writeln("Внутренняя ошибка (Код: " + errorCode + ") \n");
        }
        else
        {
            this.writeln("Ошибка: " + plugin.errorDescription[errorCode] + "\n");
        }
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

    getCustomExtensions: function () {
        var inputs = $("#custom-extensions input");
        var customExtensions = [];

        for (var i = 0; i < inputs.length/3; i++) {
            var oid = inputs[i*3].value;
            var asnBase64 = inputs[i*3+1].value;
            var crit = inputs[i*3+2];

            if (oid.length == 0 || asnBase64.length == 0)
                continue;

            customExtensions.push({
                "oid": oid,
                "value": asnBase64,
                "criticality": crit.checked
            });
        }
        return customExtensions;
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
    },

    newVerifySigner: function() {
        var table = event.currentTarget.closest(".Certificates");

        var splitter = table.insertRow(table.rows.length - 1);
        var cell = splitter.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "<hr>";

        var row = $(table.rows[0]).clone().insertAfter(splitter);
        row.find("td").colSpan = 1;
        row.find("textarea").val("");

        cell = row[0].insertCell(1);
        cell.innerHTML = '<img src="images/close.png" alt="x" width=24 height=24/>';
        cell.onclick = $.proxy(this.deleteVerifySigner, this);
    },

    deleteVerifySigner: function() {
        const numberOfRowsToDelete = 2;
        var table = event.currentTarget.closest(".Certificates");
        var row = event.currentTarget.closest("tr");
        var rIndex = row.rowIndex;

        for(var i = 0; i < numberOfRowsToDelete; i++)
            table.deleteRow(rIndex-1);
    },

    clearVerifySigners: function(table) {
        $(table.rows[0]).find("textarea").val("");

        while(table.rows.length != 2)
            table.deleteRow(1);
    },

    newCmsEncryptRecipient: function() {
        var table = document.getElementById("Recipients");

        var row = table.insertRow(table.rows.length - 1);
        var cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "<hr>";

        row = table.insertRow(table.rows.length - 1);
        cell = row.insertCell(0);
        cell.innerHTML = '<label for="encrypt-certificate">Тело сертификата</label>\
            <textarea id="encrypt-certificate" class="recipient" rows="7"></textarea>'

        cell = row.insertCell(1);
        cell.innerHTML = "<img src=\"images/close.png\" alt=\"x\" width=24 height=24/>";
        cell.onclick = this.deleteRecipient;
    },

    deleteRecipient: function() {
        var table = document.getElementById("Recipients");
        var row = $(this).closest("tr");
        var rIndex = row[0].rowIndex;

        for(var i = 0; i < 2; i++)
            table.deleteRow(rIndex-1);
    },

    newCustomExtension: function() {
        var table = document.getElementById("custom-extensions");

        var row = table.insertRow(table.rows.length - 1);
        var cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "<hr>";

        row = table.insertRow(table.rows.length - 1);
        cell = row.insertCell(0);
        cell.innerHTML = "<label>OID</label>";
        cell = row.insertCell(1);
        cell.innerHTML = "<input type=\"text\" name=\"custom-ext-oid\">";
        cell = row.insertCell(2);
        cell.innerHTML = "<img src=\"images/close.png\" alt=\"x\" width=24 height=24/>";
        cell.onclick = this.deleteCustomExtension;

        row = table.insertRow(table.rows.length - 1);
        cell = row.insertCell(0);
        cell.innerHTML = "<label>value</label>";
        cell = row.insertCell(1);
        cell.innerHTML = "<input type=\"text\" name=\"custom-ext-value\">";

        row = table.insertRow(table.rows.length - 1);
        cell = row.insertCell(0);
        cell.innerHTML = "<label><input class=\"checkbox-input\" type=\"checkbox\" name=\"custom-ext-crit\">Critical</label>";
    },

    deleteCustomExtension: function() {
        var table = document.getElementById("custom-extensions");
        var row = $(this).closest("tr");
        var rIndex = row[0].rowIndex;

        for(var i = 0; i < 4; i++)
            table.deleteRow(rIndex-1);
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
    this.errorDescription[this.errorCodes.PIN_INVALID] = "PIN-код содержит недопустимые символы";
    this.errorDescription[this.errorCodes.USER_PIN_NOT_INITIALIZED] = "PIN-код пользователя не инициализирован";
    this.errorDescription[this.errorCodes.PIN_EXPIRED] = "Действие PIN-кода истекло";
    this.errorDescription[this.errorCodes.INAPPROPRIATE_PIN] = "Устанавливаемый PIN-код не удовлетворяет политикам смены PIN-кодов";
    this.errorDescription[this.errorCodes.PIN_IN_HISTORY] = "Устанавливаемый PIN-код содержится в истории PIN-кодов";

    this.errorDescription[this.errorCodes.SESSION_INVALID] = "Состояние токена изменилось";
    this.errorDescription[this.errorCodes.USER_NOT_LOGGED_IN] = "Выполните вход на устройство";
    this.errorDescription[this.errorCodes.ALREADY_LOGGED_IN] = "Вход на устройство уже был выполнен";

    this.errorDescription[this.errorCodes.ATTRIBUTE_READ_ONLY] = "Свойство не может быть изменено";
    this.errorDescription[this.errorCodes.KEY_NOT_FOUND] = "Соответствующая сертификату ключевая пара не найдена";
    this.errorDescription[this.errorCodes.KEY_ID_NOT_UNIQUE] = "Идентификатор ключевой пары не уникален";
    this.errorDescription[this.errorCodes.CEK_NOT_AUTHENTIC] = "Выбран неправильный ключ";
    this.errorDescription[this.errorCodes.KEY_LABEL_NOT_UNIQUE] = "Метка ключевой пары не уникальна";
    this.errorDescription[this.errorCodes.WRONG_KEY_TYPE] = "Неправильный тип ключа";
    this.errorDescription[this.errorCodes.LICENCE_READ_ONLY] = "Лицензия доступна только для чтения";

    this.errorDescription[this.errorCodes.DATA_INVALID] = "Неверные данные";
    this.errorDescription[this.errorCodes.DATA_LEN_RANGE] = "Некорректный размер данных";
    this.errorDescription[this.errorCodes.UNSUPPORTED_BY_TOKEN] = "Операция не поддерживается токеном";
    this.errorDescription[this.errorCodes.KEY_FUNCTION_NOT_PERMITTED] = "Операция запрещена для данного типа ключа";

    this.errorDescription[this.errorCodes.BASE64_DECODE_FAILED] = "Ошибка декодирования даных из BASE64";
    this.errorDescription[this.errorCodes.PEM_ERROR] = "Ошибка разбора PEM";
    this.errorDescription[this.errorCodes.ASN1_ERROR] = "Ошибка декодирования ASN1 структуры";

    this.errorDescription[this.errorCodes.FUNCTION_REJECTED] = "Операция отклонена пользователем";
    this.errorDescription[this.errorCodes.FUNCTION_FAILED] = "Невозможно выполнить операцию";
    this.errorDescription[this.errorCodes.MECHANISM_INVALID] = "Указан неправильный механизм";
    this.errorDescription[this.errorCodes.ATTRIBUTE_VALUE_INVALID] = "Передан неверный атрибут";

    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_ISSUER_CERT] = "Невозможно получить сертификат эмитента";
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
    this.errorDescription[this.errorCodes.X509_OUT_OF_MEM] = "Не хватает памяти";
    this.errorDescription[this.errorCodes.X509_DEPTH_ZERO_SELF_SIGNED_CERT] = "Недоверенный самоподписанный сертификат";
    this.errorDescription[this.errorCodes.X509_SELF_SIGNED_CERT_IN_CHAIN] = "В цепочке обнаружен недоверенный самоподписанный сертификат";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_ISSUER_CERT_LOCALLY] = "Невозможно получить локальный сертификат эмитента";
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
    this.errorDescription[this.errorCodes.CMS_CERTIFICATE_ALREADY_PRESENT] = "Сертификат уже используется";
    this.errorDescription[this.errorCodes.CANT_HARDWARE_VERIFY_CMS] = "Проверка множественной подписи с вычислением хеша на устройстве не поддерживается";
    this.errorDescription[this.errorCodes.DECRYPT_UNSUCCESSFUL] = "Расшифрование не удалось";

    this.errorDescription[this.errorCodes.TS_TOKEN_MISSED] = "Ответ службы меток доверенного времени не содержит саму метку";
    this.errorDescription[this.errorCodes.TS_WRONG_CONTENT_TYPE] = "Метка доверенного времени имеет неверный тип содержимого";
    this.errorDescription[this.errorCodes.TS_MUST_BE_ONE_SIGNER] = "Метка доверенного времени должна иметь одного подписанта";
    this.errorDescription[this.errorCodes.TS_NO_CONTENT] = "Метка доверенного времени не содержит данные";
    this.errorDescription[this.errorCodes.TS_ESS_SIGNING_CERT_ERROR] = "Метка доверенного времени не содержит ESSCertID сертификата TSA";
    this.errorDescription[this.errorCodes.TS_UNSUPPORTED_VERSION] = "Версия метки доверенного времени не поддерживается";
    this.errorDescription[this.errorCodes.TS_POLICY_MISMATCH] = "Политика в метке доверенного времени отличается от запрошенной";
    this.errorDescription[this.errorCodes.TS_NONCE_NOT_RETURNED] = "Метка доверенного времени не содержит nonce, хотя он был запрошен";
    this.errorDescription[this.errorCodes.TS_TSA_UNTRUSTED] = "Метка доверенного времени создана недоверенным TSA";

    this.errorDescription[this.errorCodes.HOST_NOT_FOUND] = "Не удалось найти сервер";
    this.errorDescription[this.errorCodes.HTTP_ERROR] = "HTTP ответ с ошибкой";
    this.errorDescription[this.errorCodes.TST_VERIFICATION_ERROR] = "Ошибка проверки timestamp токена";

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

    enumerateDevices: function (update) {
        if (update) {
            var options = {"mode": this.ENUMERATE_DEVICES_EVENTS};

            this.pluginObject.enumerateDevices(options).then($.proxy(function (devices) {
                for (key in devices) {
                    switch (key) {
                        case "connected":
                            for(var d in devices[key]) {
                                var dev = devices[key][d];
                                // To handle fast device reconnect first try to remove it.
                                ui.removeDevice(dev);

                                this.pluginObject.getDeviceInfo(dev, plugin.TOKEN_INFO_LABEL).then($.proxy(function (device) {
                                    return function (label) {
                                        if (label == "Rutoken ECP <no label>") label = "Rutoken ECP #" + device.toString();
                                        ui.removeInfoInDeviceList();
                                        ui.addDevice(device, label, false);

                                        if (ui.device() == device) {
                                            if (this.autoRefresh) this.enumerateKeys(device);
                                            if (this.autoRefresh) this.enumerateCertificates(device);
                                            else ui.clearCertificateList("Обновите список сертификатов");
                                        }
                                    };
                                }(dev), this), $.proxy(ui.printError, ui));
                            }
                            break;
                        case "disconnected":
                            for (var d in devices[key]) {
                                var selectedDevice = ui.device(),
                                    device = devices[key][d];

                                ui.removeDevice(device);

                                if (device == selectedDevice) {
                                    try {
                                        var dev = ui.device();

                                        if (this.autoRefresh) this.enumerateKeys(ui.device());
                                        if (this.autoRefresh) this.enumerateCertificates(ui.device());
                                        else ui.clearCertificateList("Обновите список сертификатов");
                                    } catch (e) {
                                        ui.clearDeviceList("Нет доступных устройств");
                                        ui.clearCertificateList("Нет доступных устройств");
                                        ui.clearKeyList("Нет доступных устройств");
                                    }
                                }
                            }
                            break;
                    }
                }
            }, this), $.proxy(ui.printError, ui));
        } else {
            ui.clearDeviceList("Список устройств обновляется...");

            var options = {"mode": this.ENUMERATE_DEVICES_LIST};

            this.pluginObject.enumerateDevices(options).then($.proxy(function (devices) {
                if (Object.keys(devices).length == 0) {
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
                    this.pluginObject.getDeviceInfo(devices[d], plugin.TOKEN_INFO_LABEL).then($.proxy(function (device) {
                        return function(label) {
                            if (label == "Rutoken ECP <no label>") label = "Rutoken ECP #" + device.toString();
                            ui.addDevice(device, label, false);
                        };
                    }(devices[d]), this), $.proxy(ui.printError, ui));
                }
            }, this), $.proxy(ui.printError, ui));
        }
    },

    enumerateKeys: function (deviceId, marker) {
        ui.clearKeyList("Список ключевых пар обновляется...");
        marker = (marker === undefined) ? "" : marker;
        deviceId = (deviceId === undefined) ? ui.device() : deviceId;
        this.pluginObject.enumerateKeys(deviceId, marker).then($.proxy(function (keys) {
            if (keys.length == 0) {
                ui.clearKeyList("На устройстве отсутствуют ключевые пары");
                return;
            }

            ui.clearKeyList();
            for (var k in keys) {
                this.pluginObject.getKeyLabel(deviceId, keys[k]).then(function (key) {
                    return function (label) {
                        if (label == "") label = "key: " + key.toString();
                        ui.addKey(key, label);
                    };
                }(keys[k]), $.proxy(ui.printError, ui));
            }
        }, this), function (error) {
            let errorCode = getErrorCode(error);
            if (errorCode == plugin.errorCodes.USER_NOT_LOGGED_IN) ui.clearKeyList(plugin.errorDescription[errorCode]);
            else ui.printError(error);
        });
    },

    enumerateCertificates: function (deviceId) {
        ui.clearCertificateList("Список сертификатов обновляется...");
        var device = (deviceId === undefined) ? ui.device() : deviceId;
        try {
            var certs = [];
            this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_USER).then($.proxy(function (certificates) {
                ui.clearCertificateList();
                for (var c in certificates)
                    certs.push({certificate: certificates[c], category: this.CERT_CATEGORY_USER});

                return this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_CA);
            }, this)).then($.proxy(function (certificates) {
                for (var c in certificates)
                    certs.push({certificate: certificates[c], category: this.CERT_CATEGORY_CA});

                return this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_OTHER);
            }, this)).then($.proxy(function (certificates) {
                for (var c in certificates)
                    certs.push({certificate: certificates[c], category: this.CERT_CATEGORY_OTHER});

                return this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_UNSPEC);
            }, this)).then($.proxy(function (certificates) {
                for (var c in certificates)
                    certs.push({certificate: certificates[c], category: this.CERT_CATEGORY_UNSPEC});

                var parsedCerts = [];
                for (var c in certs) {
                    parsedCerts.push(this.pluginObject.parseCertificate(device, certs[c].certificate).then(function (handle, category) {
                        return function (parsedCert) {
                            ui.addCertificate(handle, parsedCert, category);
                        };
                    }(certs[c].certificate, certs[c].category), $.proxy(ui.printError, ui)));
                }

                Promise.all(parsedCerts).then(function () {
                    try {
                        ui.certificate();
                    } catch (e) {
                        ui.clearCertificateList("На устройстве отсутствуют сертификаты");
                    }
                });
            }, this), function (error) {
                ui.printError(error);
                ui.clearCertificateList("Произошла ошибка");
            });
        } catch (e) {
            // ui now throws an exception if there is no devices avalable
            console.log(e);
        }
    },

    enumerateStoreCertificates: function () {
        function addSystemStoreCertificates(certificates) {
            for (var c in certificates) {
                ui.addSystemStoreCertificate(certificates[c]);
            }
        }

        ui.clearSystemStoreCertificateList("Список сертификатов обновляется...");
        try {
            var options = {};
            this.pluginObject.enumerateStoreCertificates(options).then($.proxy(function (certificates) {
                ui.clearSystemStoreCertificateList();
                $.proxy(addSystemStoreCertificates, this)(certificates);

                try {
                    var systemStoreCertificate = ui.systemStoreCertificate();
                } catch (e) {
                    ui.clearSystemStoreCertificateList("В хранилище отсутствуют сертификаты");
                }
            }, this), function (error) {
                ui.printError(error);
                ui.clearSystemStoreCertificateList("Произошла ошибка");
            });
        } catch (e) {
            console.log(e);
        }
    },

    login: function () {
        this.pluginObject.login(ui.device(), ui.pin()).then($.proxy(function () {
            ui.writeln("Вход выполнен\n");
            if (this.autoRefresh) this.enumerateKeys();
            else ui.clearKeyList("Обновите список ключевых пар");
        }, this), $.proxy(ui.printError, ui));
    },

    logout: function () {
        this.pluginObject.logout(ui.device()).then($.proxy(function () {
            ui.writeln("Выход выполнен\n");
            plugin.pluginObject.getDeviceInfo(ui.device(), plugin.TOKEN_INFO_IS_LOGGED_IN).then(function (result) {
                if (!result) ui.clearKeyList("Выполните вход на устройство");
            }, $.proxy(ui.printError, ui));
        }, this), $.proxy(ui.printError, ui));
    },

    savePin: function () {
        this.pluginObject.savePin(ui.device()).then($.proxy(function () {
            ui.writeln("PIN-код сохранен в кэше\n");
        }, this), $.proxy(ui.printError, ui));
    },

    removePin: function () {
        this.pluginObject.removePin(ui.device()).then($.proxy(function () {
            ui.writeln("PIN-код удален из кэша\n");
            ui.clearKeyList("Выполните вход на устройство");
        }, this), $.proxy(ui.printError, ui));
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

            plugin.pluginObject.getDeviceInfo(ui.device(), ui.infoType()).then(function (result) {
                var message = result;

                if (info === plugin.TOKEN_INFO_DEVICE_TYPE) {
                    message = "Невозможно определить тип устройства";
                    switch (result) {
                    case plugin.TOKEN_TYPE_UNKNOWN:
                        message = "Неизвестное устройство";
                        break;
                    case plugin.TOKEN_TYPE_RUTOKEN_ECP:
                        message = "Рутокен ЭЦП";
                        break;
                    case plugin.TOKEN_TYPE_RUTOKEN_WEB:
                        message = "Рутокен Web";
                        break;
                    case plugin.TOKEN_TYPE_RUTOKEN_ECP_SC:
                        message = "Рутокен ЭЦП SC";
                        break;
                    }
                }

                if (info === plugin.TOKEN_INFO_FORMATS) {
                    var m = {};
                    m[plugin.DEVICE_DATA_FORMAT_PLAIN] = "DEVICE_DATA_FORMAT_PLAIN";
                    m[plugin.DEVICE_DATA_FORMAT_SAFETOUCH] = "DEVICE_DATA_FORMAT_SAFETOUCH";

                    message = "[" + result.map(function(value) {
                        return m[value];
                    }).join(", ") + "]";
                }

                if (info === plugin.TOKEN_INFO_FEATURES) {
                    var m = result;
                    var bio = {};
                    bio[plugin.BIO_TYPE_NOT_SUPPORTED] = "BIO_TYPE_NOT_SUPPORTED";
                    bio[plugin.BIO_TYPE_NOT_SPECIFIED] = "BIO_TYPE_NOT_SPECIFIED";

                    var interfaces = {};
                    interfaces[plugin.INTERFACE_TYPE_USB] = "INTERFACE_TYPE_USB";
                    interfaces[plugin.INTERFACE_TYPE_BT] = "INTERFACE_TYPE_BT";
                    interfaces[plugin.INTERFACE_TYPE_UART] = "INTERFACE_TYPE_UART";
                    interfaces[plugin.INTERFACE_TYPE_ISO] = "INTERFACE_TYPE_ISO";
                    interfaces[plugin.INTERFACE_TYPE_SD] = "INTERFACE_TYPE_SD";
                    interfaces[plugin.INTERFACE_TYPE_NFC] = "INTERFACE_TYPE_NFC";

                    var smType = {};
                    smType[plugin.SECURE_MESSAGING_OFF] = "SECURE_MESSAGING_OFF";
                    smType[plugin.SECURE_MESSAGING_ON] = "SECURE_MESSAGING_ON";
                    smType[plugin.SECURE_MESSAGING_ENHANCED] = "SECURE_MESSAGING_ENHANCED";
                    smType[plugin.SECURE_MESSAGING_UNSUPPORTED] = "SECURE_MESSAGING_UNSUPPORTED";
                    smType[plugin.SECURE_MESSAGING_NOT_SPECIFIED] = "SECURE_MESSAGING_NOT_SPECIFIED";

                    m["interfaces"] = result["interfaces"].map(function (value) { return interfaces[value]; });
                    m["bio"] = bio[result["bio"]];
                    m["smType"] = smType[result["smType"]];

                    message = JSON.stringify(m);
                }

                if (info === plugin.TOKEN_INFO_PINS_INFO) {
                    message = JSON.stringify(result);
                }

                if (info === plugin.TOKEN_INFO_SUPPORTED_MECHANISMS) {
                    var hashes = {};
                    hashes[plugin.HASH_TYPE_GOST3411_94] = "HASH_TYPE_GOST3411_94";
                    hashes[plugin.HASH_TYPE_GOST3411_12_256] = "HASH_TYPE_GOST3411_12_256";
                    hashes[plugin.HASH_TYPE_GOST3411_12_512] = "HASH_TYPE_GOST3411_12_512";
                    hashes[plugin.HASH_TYPE_MD5] = "HASH_TYPE_MD5";
                    hashes[plugin.HASH_TYPE_SHA1] = "HASH_TYPE_SHA1";
                    hashes[plugin.HASH_TYPE_SHA256] = "HASH_TYPE_SHA256";
                    hashes[plugin.HASH_TYPE_SHA512] = "HASH_TYPE_SHA512";

                    var signs = {};
                    signs[plugin.PUBLIC_KEY_ALGORITHM_GOST3410_2001] = "PUBLIC_KEY_ALGORITHM_GOST3410_2001";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_GOST3410_2012_256] = "PUBLIC_KEY_ALGORITHM_GOST3410_2012_256";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_GOST3410_2012_512] = "PUBLIC_KEY_ALGORITHM_GOST3410_2012_512";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_RSA_512] = "PUBLIC_KEY_ALGORITHM_RSA_512";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_RSA_768] = "PUBLIC_KEY_ALGORITHM_RSA_768";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_RSA_1024] = "PUBLIC_KEY_ALGORITHM_RSA_1024";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_RSA_1280] = "PUBLIC_KEY_ALGORITHM_RSA_1280";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_RSA_1536] = "PUBLIC_KEY_ALGORITHM_RSA_1536";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_RSA_1792] = "PUBLIC_KEY_ALGORITHM_RSA_1792";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_RSA_2048] = "PUBLIC_KEY_ALGORITHM_RSA_2048";
                    signs[plugin.PUBLIC_KEY_ALGORITHM_RSA_4096] = "PUBLIC_KEY_ALGORITHM_RSA_4096";

                    var ciphers = {};
                    ciphers[plugin.CIPHER_ALGORITHM_DES] = "CIPHER_ALGORITHM_DES";
                    ciphers[plugin.CIPHER_ALGORITHM_3DES] = "CIPHER_ALGORITHM_3DES";
                    ciphers[plugin.CIPHER_ALGORITHM_AES128] = "CIPHER_ALGORITHM_AES128";
                    ciphers[plugin.CIPHER_ALGORITHM_AES192] = "CIPHER_ALGORITHM_AES192";
                    ciphers[plugin.CIPHER_ALGORITHM_AES256] = "CIPHER_ALGORITHM_AES256";
                    ciphers[plugin.CIPHER_ALGORITHM_GOST28147] = "CIPHER_ALGORITHM_GOST28147";

                    message = "hashes:\n";
                    message += "&middot hardware: [" + result["hash"]["hardware"].map(function (value) { return hashes[value]; }).join(", ") + "]\n";
                    message += "&middot software: [" + result["hash"]["software"].map(function (value) { return hashes[value]; }).join(", ") + "]\n";

                    message += "signs:\n";
                    message += "&middot hardware: [" + result["sign"]["hardware"].map(function (value) { return signs[value]; }).join(", ") + "]\n";
                    message += "&middot software: [" + result["sign"]["software"].map(function (value) { return signs[value]; }).join(", ") + "]\n";

                    message += "ciphers:\n";
                    message += "&middot hardware: [" + result["cipher"]["hardware"].map(function (value) { return ciphers[value]; }).join(", ") + "]\n";
                    message += "&middot software: [" + result["cipher"]["software"].map(function (value) { return ciphers[value]; }).join(", ") + "]\n";
                }

                if (info == plugin.TOKEN_INFO_FKN_SUPPORTED) {
                    message = JSON.stringify(result);
                }

                if (info == plugin.TOKEN_INFO_FREE_MEMORY)
                    message += " byte(s)";

                message += " (" + info + ")";
                ui.printResult(message);
            }, $.proxy(ui.printError, ui));
        }
    })();

    this.ChangePin = new(function () {
        Test.call(this);
        this.description = function () {
            return "Смена PIN-кода пользователя";
        };
        this.runTest = function () {
            var options = {};
            if (ui.checkboxState(this.container, "use-admin-pin") == "on") options.useAdminPin = true;
            plugin.pluginObject.changePin(ui.device(), ui.getContent(this.container, 1),
                ui.getContent(this.container, 2), options).then(function () {
                ui.printResult();
            }, $.proxy(ui.printError, ui));
        }
    })();

    this.UnblockUserPin = new(function () {
        Test.call(this);
        this.description = function () {
            return "Разблокировка PIN-кода пользователя";
        };
        this.runTest = function () {
            plugin.pluginObject.unblockUserPin(ui.device(), ui.getContent(this.container, 0)).then(function () {
                ui.printResult();
            }, $.proxy(ui.printError, ui));
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

            plugin.pluginObject.formatToken(ui.device(), options).then($.proxy(function () {
                ui.printResult();
            }, this), $.proxy(ui.printError, ui));
        }
    })();

    this.GenerateKeyPair = new(function () {
        Test.call(this);
        this.description = function () {
            return "Генерация ключевой пары на устройстве";
        };
        this.runTest = function () {
            var algorithm = plugin[this.container.find(".public-key-algorithm").val()];
            var marker = this.container.find("#generate-key-marker").val();

            var options = {"publicKeyAlgorithm": algorithm};
            if (ui.checkboxState(this.container, "need-pin") == "on") options.needPin = true;
            if (ui.checkboxState(this.container, "need-confirm") == "on") options.needConfirm = true;
            if (ui.checkboxState(this.container, "journal") == "on") options.keyType = plugin.KEY_TYPE_JOURNAL;
            if (ui.checkboxState(this.container, "set-external-id") == "on") options.id = this.container.find("#generate-key-id").val();

            if (algorithm === plugin.PUBLIC_KEY_ALGORITHM_GOST3410_2001) {
                options.paramset = "A";
                options.signatureSize = 512;
            } else if (algorithm === plugin.PUBLIC_KEY_ALGORITHM_GOST3410_2012_256) {
                options.paramset = "A";
                options.signatureSize = 512;
            } else if (algorithm === plugin.PUBLIC_KEY_ALGORITHM_GOST3410_2012_512) {
                options.paramset = "A";
                options.signatureSize = 1024;
            } else if (algorithm === plugin.PUBLIC_KEY_ALGORITHM_RSA) {
                let rsaSize = parseInt(this.container.find(".rsa-keygen-size").val(), 10);
                options.signatureSize = rsaSize;
            }

            plugin.pluginObject.generateKeyPair(ui.device(), undefined, marker, options).then($.proxy(function () {
                ui.printResult();
                if (plugin.autoRefresh) plugin.enumerateKeys();
                else ui.clearKeyList("Обновите список ключевых пар");
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.EnumerateKeys = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение списка ключевых пар на устройстве по маркеру";
        };
        this.runTest = function () {
            ui.writeln("Маркер: " + ui.getContent(this.container));
            plugin.pluginObject.enumerateKeys(ui.device(), ui.getContent(this.container)).then($.proxy(ui.printResult, ui),
                $.proxy(ui.printError, ui));
        }
    })();

    this.SetKeyLabel = new(function () {
        Test.call(this);
        this.description = function () {
            return "Установка метки ключевой пары";
        };
        this.runTest = function () {
            plugin.pluginObject.setKeyLabel(ui.device(), ui.key(), ui.getContent(this.container)).then($.proxy(function () {
                ui.printResult();
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
            plugin.pluginObject.getKeyLabel(ui.device(), ui.key()).then($.proxy(ui.printResult, ui), $.proxy(ui.printError, ui));
        }
    })();

    this.GetKeyInfo = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение информации о ключевой паре";
        };
        this.runTest = function () {
            var info = ui.keyInfoType();
            plugin.pluginObject.getKeyInfo(ui.device(), ui.key(), info).then(function (result) {
                var message = result;
                switch(info) {
                case plugin.KEY_INFO_ALGORITHM:
                    switch(result) {
                    case plugin.PUBLIC_KEY_ALGORITHM_GOST3410_2001:
                        message = "ГОСТ Р 34.10-2001";
                        break;
                    case plugin.PUBLIC_KEY_ALGORITHM_GOST3410_2012_256:
                        message = "ГОСТ Р 34.10-2012 256";
                        break;
                    case plugin.PUBLIC_KEY_ALGORITHM_GOST3410_2012_512:
                        message = "ГОСТ Р 34.10-2012 512";
                        break;
                    case plugin.PUBLIC_KEY_ALGORITHM_RSA:
                        message = "RSA";
                        break;
                    default:
                        message = "Неизвестный тип алгоритма ключа: " + result;
                        break;
                    }
                    break;
                }
                ui.printResult(message);
            }, $.proxy(ui.printError, ui));
        }
    })();

    this.GetPublicKey = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение открытого ключа ключевой пары";
        };
        var options = {};
        this.runTest = function () {
            plugin.pluginObject.getPublicKeyValue(ui.device(), ui.key(), options).then($.proxy(ui.printResult, ui), $.proxy(ui.printError, ui));
        }
    })();

    this.DeleteKeyPair = new(function () {
        Test.call(this);
        this.description = function () {
            return "Удаление ключевой пары с устройства";
        };
        this.runTest = function () {
            plugin.pluginObject.deleteKeyPair(ui.device(), ui.key()).then($.proxy(function () {
                ui.printResult();
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
            plugin.pluginObject.getJournal(ui.device(), ui.key(), {}).then($.proxy(function (j) {
                if (j === null) ui.printResult();
                else {
                    ui.printResult(j);
                    ui.setContent(this.container, "journal: " + j.journal + "\nsignature: " + j.signature);
                }
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.setLicence = new (function () {
        Test.call(this);
        this.description = function () {
            return "Запись лицензии на токен";
        };
        this.runTest = function () {
            plugin.pluginObject.setLicence(ui.device(), this.container.find(".licence-id").val(), ui.getContent(this.container, 0)).then(function () {
                ui.printResult();
            }, $.proxy(ui.printError, ui));
        };
    })();

    this.getLicence = new (function () {
        Test.call(this);
        this.description = function () {
            return "Получение лицензии с токена";
        };
        this.runTest = function () {
            plugin.pluginObject.getLicence(ui.device(), this.container.find(".licence-id").val()).then($.proxy(ui.printResult, ui), $.proxy(ui.printError, ui));
        };
    })();

    this.CreatePkcs10 = new(function () {
        Test.call(this);
        this.description = function () {
            return "Формирование PKCS10 запроса";
        };
        this.runTest = function () {
            var options = {
                "subjectSignTool": this.container.find(".subject-sign-tool").val(),
                "hashAlgorithm": plugin[this.container.find(".hash-algorithm").val()],
                "customExtensions": ui.getCustomExtensions()
            };
            plugin.pluginObject.createPkcs10(ui.device(), ui.key(), ui.getSubject(), ui.getExtensions(), options).then($.proxy(function (res) {
                ui.setContent(this.container, res);
                ui.printResult(res);
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.ImportCertificate = new(function () {
        Test.call(this);
        this.description = function () {
            return "Импорт сертификата на устройство";
        };
        this.runTest = function () {
            plugin.pluginObject.importCertificate(ui.device(), ui.getContent(this.container), ui.certificateType()).then($.proxy(function (certificateHandle) {
                if (plugin.autoRefresh) plugin.enumerateCertificates();
                else ui.clearCertificateList("Обновите список сертификатов");
                ui.printResult(certificateHandle);
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.DeleteCertificate = new(function () {
        Test.call(this);
        this.description = function () {
            return "Удаление сертификата";
        };
        this.runTest = function () {
            plugin.pluginObject.deleteCertificate(ui.device(), ui.certificate()).then($.proxy(function () {
                ui.printResult();
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
            plugin.pluginObject.getKeyByCertificate(ui.device(), ui.certificate()).then($.proxy(ui.printResult, ui),
                $.proxy(ui.printError, ui));
        };
    })();

    this.GetCertificateInfo = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение информации о сертификате";
        };
        this.runTest = function () {
            var infoType = ui.certificateInfoType();
            plugin.pluginObject.getCertificateInfo(ui.device(), ui.certificate(), infoType).then($.proxy(ui.printResult, ui),
                $.proxy(ui.printError, ui));
        };
    })();

    this.SignMessage = new(function () {
        Test.call(this);
        this.description = function () {
            return "Подпись сообщения";
        };

        this.runTest = function () {
            var options = {};

            ui.setContent(this.container, "");
            options.addSignTime = ui.checkboxState(this.container, "add-sign-time") == "on" ? true : false;
            options.useHardwareHash = ui.checkboxState(this.container, "use-hw-hash") == "on" ? true : false;
            options.detached = ui.checkboxState(this.container, "detached-sign") == "on" ? true : false;
            options.addUserCertificate = ui.checkboxState(this.container, "add-user-cert") == "on" ? true : false;
            options.addSystemInfo = ui.checkboxState(this.container, "add-system-info") == "on" ? true : false;
            options.addSecurityProductsInfo = ui.checkboxState(this.container, "add-security-products-info") == "on" ? true : false;
            options.addEssCert = ui.checkboxState(this.container, "add-ess-cert") == "on" ? true : false;
            options.CMS = ui.getContent(this.container, 1);
            if (ui.checkboxState(this.container, "rsa-hash") == "on")
                options.rsaHashAlgorithm = plugin[this.container.find(".cms-hash-alg").val()];
            if (ui.checkboxState(this.container, "set-content-type") == "on")
                options.eContentType = this.container.find("#content-type").val();

            var dataFormat = plugin[this.container.find(".data-format").val()];

            if (ui.checkboxState(this.container, "add-ts-token") == "on") {
                options.tspOptions = {};
                options.tspOptions.url = this.container.find(".tsa-url").val();
                options.tspOptions.digestAlg = plugin[this.container.find(".ts-hash-alg").val()];
                options.tspOptions.cert = ui.checkboxState(this.container, "tsa-cert-req") === "on" ? true : false;
                options.tspOptions.nonce = ui.checkboxState(this.container, "nonce") === "on" ? true : false;
                const policy = this.container.find(".set-policy").val();
                if (policy.length)
                    options.tspOptions.policy = policy;
    
                options.tspOptions.extOid = this.container.find(".ext-oid").val();
                options.tspOptions.extValue = this.container.find(".ext-value").val();
                options.tspOptions.extCrit = ui.checkboxState(this.container, "ext-crit") === "on" ? true : false;

                options.tspOptions.verifyTsToken = ui.checkboxState(this.container, "verify-ts-token") === "on" ? true : false;

                var caCert = this.container.find(".ca-input").val();
                if (caCert) {
                    options.tspOptions.CA = new Array();
                    options.tspOptions.CA.push(caCert);
                }

                options.tspOptions.certificates = ui.getArray( this.container, ".verify-ts-signer");
            }

            if (ui.useConsole) {
                console.time("sign");
                console.log("HW", options.useHardwareHash);
                console.log("detached: ", options.detached);
                console.log("system-info: ", options.addSystemInfo);
                console.log("dataFormat: ", dataFormat);
            }
            plugin.pluginObject.sign(ui.device(), ui.certificate(), ui.getContent(this.container), dataFormat, options).then($.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("sign");
                }
                ui.setContent(this.container, res);
                ui.printResult(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.CmcRequest = new(function () {
        Test.call(this);
        this.description = function () {
            return "Запрос в формате CMC";
        };

        this.runTest = function () {
            ui.setContent(this.container, "");

            if (!ui.getContent(this.container).length)
                throw 'Ошибка: Укажите PKCS #10 запрос';
            var data = asn1Utils.getCmcPkiData(ui.getContent(this.container));

            var options = {};
            options.addSignTime = true;
            options.eContentType = "1.3.6.1.5.5.7.12.2"; // id-cct-PKIData

            var dataFormat = plugin["DATA_FORMAT_BASE64"];

            plugin.pluginObject.sign(ui.device(), ui.certificate(), data, dataFormat, options).then($.proxy(function (res) {
                ui.setContent(this.container, res);
                ui.printResult(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.TsRequest = new(function () {
        Test.call(this);
        this.description = function () {
            return "TS запрос";
        };

        this.runTest = function () {
            ui.setContent(this.container, "");

            if (!ui.getContent(this.container).length)
                throw 'Ошибка: Укажите подписанный CMS';
            const signature = asn1Utils.getSignatureFromSignedCms(ui.getContent(this.container));
            const hashType = plugin[this.container.find(".hash-algorithm").val()];
            var options = {};
            options.cert = ui.checkboxState(this.container, "tsa-cert-req") === "on" ? true : false;
            options.nonce = ui.checkboxState(this.container, "nonce") === "on" ? true : false;
            const policy = this.container.find(".set-policy").val();
            if (policy.length)
                options.policy = policy;

            const extOid = this.container.find(".ext-oid").val();
            const extValue = this.container.find(".ext-value").val();
            const extCrit = ui.checkboxState(this.container, "ext-crit") === "on" ? true : false;
            if (extOid.length) {
                options.extensions = [{
                    "oid": extOid,
                    "value": extValue,
                    "criticality": extCrit
                }];
            }

            plugin.pluginObject.createTsRequest(signature, plugin["DATA_FORMAT_BASE64"], hashType, options).then($.proxy(function (req) {
                ui.setContent(this.container, req);
                ui.printResult(req);
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
            options.base64 = ui.checkboxState(this.container, "in-base64") == "on" ? true : false;

            var hashType = plugin[this.container.find(".hash-algorithm").val()];

            if (ui.useConsole) {
                console.time("calc-hash");
                console.log("HW", options.useHardwareHash);
                console.log("base64", options.base64);
            }
            plugin.pluginObject.digest(ui.device(), hashType, ui.getContent(this.container, 0), options).then($.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("calc-hash");
                }
                ui.setContent(this.container, res);
                ui.printResult(res);
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
            options.hashAlgorithm = plugin[this.container.find(".hash-algorithm").val()];

            if (ui.useConsole) {
                console.time("sign-hash");
                console.log("HW", options.useHardwareHash);
                console.log("detached: ", options.computeHash);
            }
            plugin.pluginObject.rawSign(ui.device(), ui.key(), ui.getContent(this.container, 0), options).then($.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("sign-hash");
                }
                ui.setContent(this.container, res);
                ui.printResult(res);
            }, this), $.proxy(ui.printError, ui));
        };
    });

    this.DeriveKey = new (function () {
        Test.call(this);
        this.description = function () {
            return "Выработка ключа обмена";
        };

        this.runTest = function () {
            var options = {};
            ui.setContent(this.container, "");

            options.ukm = ui.getContent(this.container, 1);

            if (ui.useConsole) {
                console.time("derive-key");
            }
            plugin.pluginObject.derive(ui.device(), ui.key(), ui.getContent(this.container, 0), options).then($.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("derive-key");
                }
                ui.setContent(this.container, res);
                ui.printResult(res);
            }, this), $.proxy(ui.printError, ui));
        };
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
            options.CMS = ui.getContent(this.container, 1);

            var isBase64 = ui.checkboxState(this.container, "in-base64") == "on" ? true : false;

            if (ui.useConsole) {
                console.time("sign");
                console.log("detached: ", options.detached);
            }
            plugin.pluginObject.sign(ui.device(), ui.certificate(), ui.getContent(this.container), isBase64, options).then($.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("sign");
                }
                ui.setContent(this.container, res);
                ui.printResult(res);
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
            plugin.pluginObject.authenticate(ui.device(), ui.certificate(), ui.getContent(this.container)).the($.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("authenticate");
                }
                ui.setContent(this.container, res);
                ui.printResult(res);
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
                plugin.pluginObject.sign(ui.device(), ui.certificate(), data, false, options).then($.proxy(function (res) {
                    ui.setContent(this.container, res);
                    ui.printResult(res);
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
            };
            options.useHardwareHash = ui.checkboxState(this.container, "use-hw-hash") == "on" ? true : false;
            options.verifyCertificate = ui.checkboxState(this.container, "verify-signer-cert") == "on" ? true : false;
            options.base64 = ui.checkboxState(this.container, "in-base64") == "on" ? true : false;
            options.data = ui.getContent(this.container, 1);

            options.certificates = ui.getArray(this.container, ".verify-signer");

            var caCert = ui.getContent(this.container, 2);
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
            plugin.pluginObject.verify(ui.device(), ui.getContent(this.container, 0), options).then($.proxy(ui.printResult, ui), $.proxy(ui.printError, ui))
        }
    });

    this.AddTstToCms = new(function () {
        Test.call(this)
        this.description = function () {
            return "Проверка доверенной метки времени и ее добавление в подписанную CMS";
        }

        this.runTest = function () {
            ui.setContent(this.container, "");

            var options = {};

            var response = ui.getContent(this.container, 0);
            var request = ui.getContent(this.container, 1);

            var cms = ui.getContent(this.container, 2);
            if (!cms.length)
                throw 'Ошибка: Укажите подписанный CMS';

            options.certificates = ui.getArray(this.container, ".verify-ts-signer");

            var caCert = ui.getContent(this.container, 4);
            if (caCert != "") {
                options.CA = new Array();
                options.CA.push(caCert);
            }

            if (ui.useConsole) {
                console.log("response: ", response);
                console.log("request: ", request);
                console.log("certificates: ", options.certificates);
                console.log("CA: ", options.CA);
            }
            plugin.pluginObject.verifyTsResponse(ui.device(), response, request, plugin["DATA_FORMAT_BASE64"], options)
                .then($.proxy(function (res) {
                    ui.printResult(res);
                    if (res === true) {
                        var cmsWithTst = asn1Utils.addTstToSignedCms(cms, response);
                        ui.setContent(this.container, cmsWithTst);
                    } else {
                        ui.writeln("Подпись доверенной метки времени недействительна\n");
                    }
                }, this), $.proxy(ui.printError, ui));
        }
    });

    this.EncryptMessage = new(function () {
        Test.call(this);
        this.description = function () {
            return "Шифрование сообщения в формате CMS";
        };

        this.runTest = function () {
            ui.setContent(this.container, "");
            var b64 = ui.checkboxState(this.container, "in-base64") == "on" ? true : false;
            var options = {
                base64: b64
            };

            if (ui.checkboxState(this.container, "cms-encrypt-cipher") == "on")
                options.cipherAlgorithm = plugin[this.container.find(".cms-encrypt-alg").val()]

            var elements = this.container.find(".recipient");
            var recipients = [];
            for (var i = 0; i < elements.length; i++)
                if (elements[i].value != "")
                    recipients.push(elements[i].value);

            plugin.pluginObject.cmsEncrypt(ui.device(), "", recipients, ui.getContent(this.container, 0),
                options).then($.proxy(function (res) {
                    if (ui.useConsole) {
                        console.timeEnd("encrypt");
                    }
                    ui.setContent(this.container, res);
                    ui.printResult(res);
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
            var b64 = ui.checkboxState(this.container, "in-base64") == "on" ? true : false;
            var options = {
                base64: b64
            };
            plugin.pluginObject.cmsDecrypt(ui.device(), ui.key(), ui.getContent(this.container, 0), options).then($.proxy(function (res) {
                if (ui.useConsole) {
                    console.timeEnd("decrypt");
                }
                ui.setContent(this.container, res);
                ui.printResult(res);
            }, this), $.proxy(ui.printError, ui));
        }
    });

    this.ParseCertificate = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение информации о выбранном сертификате";
        }
        this.runTest = function () {
            plugin.pluginObject.parseCertificate(ui.device(), ui.certificate()).then($.proxy(function (res) {
                ui.setContent(this.container, res.text);
                ui.printResult(res);
            }, this), $.proxy(ui.printError, ui))
        }
    })();

    this.GetCertificate = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получение тела выбранного сертификата в base64";
        }
        this.runTest = function () {
            plugin.pluginObject.getCertificate(ui.device(), ui.certificate()).then($.proxy(function (res) {
                ui.setContent(this.container, res);
                ui.printResult(res);
            }, this), $.proxy(ui.printError, ui))
        }
    })();

    this.GetStoreCertificate = new (function () {
        Test.call(this);
        this.description = function () {
            return "Получение тела выбранного сертификата из системного хранилища в PEM";
        }
        this.runTest = function () {
            var options = {};

            plugin.pluginObject.getStoreCertificate(ui.systemStoreCertificate(), options).then($.proxy(function (res) {
                ui.setContent(this.container, res);
                ui.printResult(res);
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
            plugin.pluginObject.parseCertificateFromString(ui.getContent(this.container)).then($.proxy(function (res) {
                ui.setContent(this.container, res.text);
                ui.printResult(res);
            }, this), $.proxy(ui.printError, ui))
        };
    })();
})();

function onPluginLoaded(pluginObject) {
    try {
        var noAutoRefresh = (document.location.search.indexOf("noauto") !== -1);

        plugin = new cryptoPlugin(pluginObject, noAutoRefresh);
        ui.registerEvents();

        window.setInterval(function() {
            if (document.visibilityState == "visible") {
                plugin.enumerateDevices(true);
            }}, 500);
    } catch (error) {
        ui.writeln(error);
    }
}

function initUi() {
    var useConsole = (document.location.search.indexOf("log") !== -1);
    ui = new testUi(useConsole);
}

function getErrorCode(error) {
    let errorCode = 0;
    if (isNmPlugin)
        errorCode = parseInt(error.message);
    else
        errorCode = error;
    return errorCode;
}

function showError(reason) {
    $("#content").css("display", "none");
    $("#console-container").css("border", "none");
    $("#bottom-bar-container").css("top", "0%");
    ui.writeln(reason);
    console.log(reason);
}

function getFFMajor() {
    var verOffset, fullVersion;
    if ((verOffset = navigator.userAgent.indexOf('Firefox')) != -1) {
        fullVersion = navigator.userAgent.substring(verOffset + 8);
        return parseInt(''+fullVersion,10);
    } else {
        return undefined;
    }
}

var isChrome = !!window.chrome;
var isFirefox = typeof InstallTrigger !== 'undefined';

window.onload = function () {
    rutoken.ready.then(function () {
        initUi();
        var performCheck = true;
        if (isFirefox && getFFMajor() < 53) { // Don't check on ESR and older ones
            performCheck = false;
        }

        isNmPlugin = true;
        if (performCheck && (isChrome || isFirefox)) {
            return rutoken.isExtensionInstalled();
        } else {
            isNmPlugin = false;
            return Promise.resolve(true);
        }
    }).then(function (result) {
        if (result) {
            return rutoken.isPluginInstalled();
        } else {
            var msg = "Расширение \"Адаптер Рутокен Плагин\" не установлено";
            if (isFirefox && getFFMajor() >= 74)
                msg += "<br><br>Для <strong>FireFox 74 и новее</strong> установите расширение из " +
                       "<a href='https://addons.mozilla.org/ru/firefox/addon/adapter-rutoken-plugin/'>официального магазина расширений Mozilla</a>."

            throw msg;
        }
    }).then(function (result) {
        if (result) {
            return rutoken.loadPlugin();
        } else {
            throw "Рутокен Плагин не установлен";
        }
    }).then(function (plugin) {
        onPluginLoaded(plugin);
    }).then(undefined, function (reason) {
        showError(reason);
    });
}
