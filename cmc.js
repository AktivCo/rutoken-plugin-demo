function base64ToUint8Buffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

function uint8BufferToBase64(buf) {
    return btoa(String.fromCharCode.apply(null, buf));
}

var cmc = new Object();
cmc.getPkiData = function(pkcs10req) {
    pkcs10req = pkcs10req.replace(/(\-+BEGIN CERTIFICATE REQUEST\-+(\r\n?|\n))|((\r\n?|\n)\-+END CERTIFICATE REQUEST\-+)/g, '');
    var der = base64ToUint8Buffer(pkcs10req);

    var bodyPartId = 1;

    var taggedRequest = new asn1js.Choice({
        value: [
            new asn1js.Constructed({
                idBlock: {
                    tagClass: 3, // CONTEXT-SPECIFIC
                    tagNumber: 0 // [0]
                },
                value: [
                    new asn1js.Integer({ value: bodyPartId }),
                    new asn1js.RawData({ data: der })
                ]
            })
        ]
    });

    var pkiData = new asn1js.Sequence({
        value: [
            new asn1js.Sequence(),
            new asn1js.Sequence({
                value: [
                    taggedRequest.value[0]
                ]
            }),
            new asn1js.Sequence(),
            new asn1js.Sequence()
        ]
    });

    return uint8BufferToBase64(new Uint8Array(pkiData.toBER()));
}

window.cmc = cmc;
