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

var asn1Utils = new Object();
asn1Utils.getCmcPkiData = function(pkcs10req) {
    pkcs10req = pkcs10req.replace(/.*-----BEGIN[^-]*(-[^-]+)*-----/g, '');
    pkcs10req = pkcs10req.replace(/-----END[^-]*(-[^-]+)*-----.*/g, '');
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

asn1Utils.getSignatureFromSignedCms = function(signedCms) {
    signedCms = signedCms.replace(/.*-----BEGIN[^-]*(-[^-]+)*-----/g, '');
    signedCms = signedCms.replace(/-----END[^-]*(-[^-]+)*-----.*/g, '');
    const der = base64ToUint8Buffer(signedCms);
    const asn1 = asn1js.fromBER(der.buffer);
    const cmsContent = new pkijs.ContentInfo({ schema: asn1.result });
    const cmsSigned = new pkijs.SignedData({ schema: cmsContent.content });
    if (cmsSigned.signerInfos.length === 0)
        throw 'No signatures found';

    const signature = cmsSigned.signerInfos[0].signature.valueBlock.valueHex;
    return uint8BufferToBase64(new Uint8Array(signature));
}

asn1Utils.addTstToSignedCms = function(signedCms, tsResp) {
    const derTsResp = base64ToUint8Buffer(tsResp);
    const tsRespContent = new pkijs.TimeStampResp({ schema: asn1js.fromBER(derTsResp.buffer).result });
    const tstAttr = new pkijs.Attribute({
        type: "1.2.840.113549.1.9.16.2.14",
        values: [tsRespContent.timeStampToken.toSchema()]
    });

    const cmsHeaderMatch = signedCms.match(/.*-----BEGIN[^-]*(-[^-]+)*-----/g);
    const cmsHeader = cmsHeaderMatch ? cmsHeaderMatch[0] : "";
    signedCms = signedCms.replace(/.*-----BEGIN[^-]*(-[^-]+)*-----/g, '');
    const cmsFooterMatch = signedCms.match(/-----END[^-]*(-[^-]+)*-----.*/g);
    const cmsFooter = cmsFooterMatch ? cmsFooterMatch[0] : "";
    signedCms = signedCms.replace(/-----END[^-]*(-[^-]+)*-----.*/g, '');

    const derCms = base64ToUint8Buffer(signedCms);
    const cmsContent = new pkijs.ContentInfo({ schema: asn1js.fromBER(derCms.buffer).result });

    var cmsSigned = new pkijs.SignedData({ schema: cmsContent.content });
    if (cmsSigned.signerInfos.length === 0)
        throw 'No signatures found';

    if (!cmsSigned.signerInfos[0].unsignedAttrs)
        cmsSigned.signerInfos[0].unsignedAttrs = new pkijs.SignedAndUnsignedAttributes({
            type: 1,
            attributes: [tstAttr]
        });
    else
        cmsSigned.signerInfos[0].unsignedAttrs.attributes.push(tstAttr);

    const cmsContentWithTst = new pkijs.ContentInfo({
        contentType: "1.2.840.113549.1.7.2",
        content: cmsSigned.toSchema()
    });

    const cmsWithTst = uint8BufferToBase64(new Uint8Array(cmsContentWithTst.toSchema().toBER(false)));

    return cmsHeader + cmsWithTst + cmsFooter;
}

window.asn1Utils = asn1Utils;
