const crypto = require('crypto');
const axios = require('axios');
const { convertXML } = require("simple-xml-to-json");
const url = require('url');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');


// Configuration for the Kuveyt Turk Virtual POS (Sanal POS)
const SANAL_POS = {
    customer_id: '400235',
    merchant_id: '496',
    username: 'apitest',
    password: 'api123',
    ok_url: 'https://virtual-pos-integration.vercel.app/ok-url',
    fail_url: 'https://virtual-pos-integration.vercel.app/fail-url',
    kart_onay_url: 'https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelPayGate',
    odeme_onay_url: 'https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelProvisionGate',
};


// Function to create a SHA-1 hash of the given data string and return it in base64 format
const createHashedData = (dataString) => {
    return Buffer.from(
        crypto.createHash('sha1').update(dataString, 'utf-8').digest()
    ).toString('base64');
};

// Function to send a POST request with XML data
const sendPostRequest = async (url, xmlData) => {
    try {
        const response = await axios.post(url, xmlData, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error sending POST request:', error);
        throw error;
    }
};

const processPayment = async (req, res) => {
    const { name, expiry, number, cvc } = req.body;
    const [month, year] = expiry.split('/').map(part => part.trim());

    const merchantOrderId = 'web-odeme';
    const total = 500;
    const city = "Istanbul";
    const country = 76;
    const addrLine1 = "Turkey";
    const postCode = 54000;
    const addrState = 40;
    const email = "dev.bllraslen@gmail.com";

    const hashedPassword = createHashedData(SANAL_POS.password);
    const hashString = `${SANAL_POS.merchant_id}${merchantOrderId}${total}${SANAL_POS.ok_url}${SANAL_POS.fail_url}${SANAL_POS.username}${hashedPassword}`;
    const hashedData = createHashedData(hashString);

    const xmlMessage = `
        <KuveytTurkVPosMessage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <APIVersion>TDV2.0.0</APIVersion>
            <OkUrl>${SANAL_POS.ok_url}</OkUrl>
            <FailUrl>${SANAL_POS.fail_url}</FailUrl>
            <HashData>${hashedData}</HashData>
            <MerchantId>${SANAL_POS.merchant_id}</MerchantId>
            <CustomerId>${SANAL_POS.customer_id}</CustomerId>
            <DeviceData>
                <DeviceChannel>02</DeviceChannel>
                <ClientIP>${req.ip}</ClientIP>
            </DeviceData>
            <CardHolderData>
                <BillAddrCity>${city}</BillAddrCity>
                <BillAddrCountry>${country}</BillAddrCountry>
                <BillAddrLine1>${addrLine1}</BillAddrLine1>
                <BillAddrPostCode>${postCode}</BillAddrPostCode>
                <BillAddrState>${addrState}</BillAddrState>
                <Email>${email}</Email>
                <MobilePhone>
                    <Cc>90</Cc>
                    <Subscriber>1234567899</Subscriber>
                </MobilePhone>
            </CardHolderData>
            <UserName>${SANAL_POS.username}</UserName>
            <CardNumber>${number}</CardNumber>
            <CardExpireDateYear>${year}</CardExpireDateYear>
            <CardExpireDateMonth>${month}</CardExpireDateMonth>
            <CardCVV2>${cvc}</CardCVV2>
            <CardHolderName>${name}</CardHolderName>
            <CardType>Troy</CardType>
            <TransactionType>Sale</TransactionType>
            <InstallmentCount>0</InstallmentCount>
            <Amount>${total}</Amount>
            <DisplayAmount>${total}</DisplayAmount>
            <CurrencyCode>0949</CurrencyCode>
            <MerchantOrderId>${merchantOrderId}</MerchantOrderId>
            <TransactionSecurity>3</TransactionSecurity>
        </KuveytTurkVPosMessage>
    `;
    try {

        const result = await axios.post(SANAL_POS.kart_onay_url , xmlMessage, {
            headers: {
                'Content-Type': 'application/html',
            },
        });

        //console.log('Payment request result:', result.data );


        res.send(result.data);


        //console.log("result " , result)

    } catch (error) {
        console.error('Error processing payment:', error);
        if (!res.headersSent) {
            res.status(500).send('Error processing payment');
        }
    }
};

// Handle payment fulfillment
const handlePaymentFulfillment = async (req, res) => {
    try {
        // Extract data from the request
        const xmlMessage = req.body;
        const paymentData = parseXmlMessage(xmlMessage);
        const {  Status } = paymentData;

        if (Status === 'Success') {
            console.log('xmlMessage', xmlMessage);
            res.send(xmlMessage);
        } else {
            //console.log('Payment failed:', TransactionId);
            res.status(400).send('Payment failed');
        }
    } catch (error) {
        console.error('Error handling payment fulfillment:', error);
        if (!res.headersSent) {
            res.status(500).send('Error handling payment fulfillment');
        }
    }
};

// XML parsing function (example implementation)
const parseXmlMessage = (xmlMessage) => {

    return {
        TransactionId: '123456789',
        Status: 'Success'
    };
};

const parseXMLValue = (keyName, arr) => {
    let val = null;
    arr.map((item, iIndex) => {
        Object.keys(item).map((param, pIndex) => {
            if(keyName === param){
                val = item[param].content;
            }
        })
    });
    return val;
}

// Function to process the approval of a payment
const processApproval = async (req, res) => {

    const total = 500;
    const city = "Istanbul";
    const country = 76;
    const addrLine1 = "Turkey";
    const postCode = 54000;
    const addrState = 40;
    const email = "dev.bllraslen@gmail.com";


    const { AuthenticationResponse } = req.body;
    const data = decodeURIComponent(AuthenticationResponse);
    const json = convertXML(data);
    const VPosMessage = await json.VPosTransactionResponseContract.children[0].VPosMessage.children;
    // console.log(json);
    // console.log(VPosMessage);
    // VPosMessage.map((item, iIndex) => {
    //     Object.keys(item).map((param, pIndex) => {
    //         console.log(param);
    //
    //         console.log(item[param].content);
    //     })
    // });

    // Extracting the required values
     const amount = parseXMLValue('Amount', VPosMessage);
     const merchantOrderId = parseXMLValue('MerchantOrderId', VPosMessage);

    const vPosMessage = json.VPosTransactionResponseContract.children.find(
        (child) => child.VPosMessage
    ).VPosMessage;

    const paymentId = vPosMessage.children.find(
        (child) => child.PaymentId
    ).PaymentId;

    const transactionUserId = paymentId.children.find(
        (child) => child.TransactionUserId
    ).TransactionUserId;

    const responseCode = transactionUserId.children.find(
        (child) => child.ResponseCode
    ).ResponseCode.content;

    const responseMessage = transactionUserId.children.find(
        (child) => child.ResponseMessage
    ).ResponseMessage.content;

// Logging the values
    console.log("ResponseCode:", responseCode);
    console.log("ResponseMessage:", responseMessage);
    console.log("amount: " , amount);
    console.log("merchantOrderId: " , merchantOrderId);



    // const merchantOrderId = data.match(/<MerchantOrderId>(.*?)<\/MerchantOrderId>/)[1];
     //const amount = data.match(/<Amount>(.*?)<\/Amount>/)[1];
    const md = data.match(/<MD>(.*?)<\/MD>/)[1];

    const hashString = `${SANAL_POS.merchant_id}${merchantOrderId}${amount}${SANAL_POS.username}${createHashedData(SANAL_POS.password)}`;
    const hashedData = createHashedData(hashString);

    const xmlMessage = `        <KuveytTurkVPosMessage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <APIVersion>TDV2.0.0</APIVersion>
            <OkUrl>${SANAL_POS.ok_url}</OkUrl>
            <FailUrl>${SANAL_POS.fail_url}</FailUrl>
            <HashData>${hashedData}</HashData>
            <MerchantId>${SANAL_POS.merchant_id}</MerchantId>
            <CustomerId>${SANAL_POS.customer_id}</CustomerId>
            <DeviceData>
                <DeviceChannel>02</DeviceChannel>
                <ClientIP>${req.ip}</ClientIP>
            </DeviceData>
            <CardHolderData>
                <BillAddrCity>${city}</BillAddrCity>
                <BillAddrCountry>${country}</BillAddrCountry>
                <BillAddrLine1>${addrLine1}</BillAddrLine1>
                <BillAddrPostCode>${postCode}</BillAddrPostCode>
                <BillAddrState>${addrState}</BillAddrState>
                <Email>${email}</Email>
                <MobilePhone>
                    <Cc>90</Cc>
                    <Subscriber>1234567899</Subscriber>
                </MobilePhone>
            </CardHolderData>
            <UserName>${SANAL_POS.username}</UserName>
            <CardNumber>5188961939192544</CardNumber>
            <CardExpireDateYear>25</CardExpireDateYear>
            <CardExpireDateMonth>06</CardExpireDateMonth>
            <CardCVV2>929</CardCVV2>
            <CardHolderName>Bilal RASLEN</CardHolderName>
            <CardType>Troy</CardType>
            <TransactionType>Sale</TransactionType>
            <InstallmentCount>0</InstallmentCount>
            <Amount>${total}</Amount>
            <DisplayAmount>${total}</DisplayAmount>
            <CurrencyCode>0949</CurrencyCode>
            <MerchantOrderId>${merchantOrderId}</MerchantOrderId>
            <TransactionSecurity>3</TransactionSecurity>
        </KuveytTurkVPosMessage>`;

    try {
        const fill = await axios.post('http://localhost:3000/payment-fulfillment', json, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });
        res.send(json);
    } catch (error) {
        console.error('Error processing payment fulfillment:', error);
        if (!res.headersSent) {
            res.status(500).send('Error processing payment fulfillment');
        }
    }
};


const processFailure = (req, res) => {
    const { AuthenticationResponse } = req.body;
    const data = decodeURIComponent(AuthenticationResponse);

    const responseCodeMatch = data.match(/<ResponseCode>(.*?)<\/ResponseCode>/);
    const responseMessageMatch = data.match(/<ResponseMessage>(.*?)<\/ResponseMessage>/);

    if (responseCodeMatch && responseCodeMatch[1] && responseMessageMatch && responseMessageMatch[1]) {
        const ResponseCode = responseCodeMatch[1];
        const ResponseMessage = responseMessageMatch[1];
        console.log('ResponseCode: ' + ResponseCode);
        console.log('ResponseMessage: ' + ResponseMessage);

        const query = new url.URLSearchParams({
            ResponseCode,
            ResponseMessage
        }).toString();

        res.redirect(`/processFailure.html?${query}`);
    } else {
        if (!responseCodeMatch || !responseCodeMatch[1]) {
            console.error('ResponseCode not found in the AuthenticationResponse');
        }
        if (!responseMessageMatch || !responseMessageMatch[1]) {
            console.error('ResponseMessage not found in the AuthenticationResponse');
        }
        res.status(400).send('Invalid AuthenticationResponse format');
    }
};

// Function to perform a SaleReversal operation
const processSaleReversal = async (req, res) => {
    const { RRN, Stan, Amount, ProvisionNumber, OrderId } = req.body;

    if (!RRN || !Stan || !Amount || !ProvisionNumber || !OrderId) {
        return res.status(400).send('Missing required fields');
    }

    const hashedPassword = createHashedData(SANAL_POS.password);
    const hashString = `${SANAL_POS.merchant_id}${OrderId}${Amount}${SANAL_POS.username}${hashedPassword}`;
    const hashedData = createHashedData(hashString);

    const xmlMessage = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                          xmlns:ser="http://boa.net/BOA.Integration.VirtualPos/Service"> 
            <soapenv:Header/> 
            <soapenv:Body> 
                <ser:SaleReversal> 
                    <ser:request> 
                        <ser:IsFromExternalNetwork>true</ser:IsFromExternalNetwork> 
                        <ser:BusinessKey>0</ser:BusinessKey> 
                        <ser:ResourceId>0</ser:ResourceId> 
                        <ser:ActionId>0</ser:ActionId> 
                        <ser:LanguageId>0</ser:LanguageId> 
                        <ser:CustomerId>${SANAL_POS.customer_id}</ser:CustomerId> 
                        <ser:MailOrTelephoneOrder>true</ser:MailOrTelephoneOrder> 
                        <ser:RRN>${RRN}</ser:RRN> 
                        <ser:Stan>${Stan}</ser:Stan> 
                        <ser:MerchantId>${SANAL_POS.merchant_id}</ser:MerchantId> 
                        <ser:Amount>${Amount}</ser:Amount> 
                        <ser:ProvisionNumber>${ProvisionNumber}</ser:ProvisionNumber> 
                        <ser:OrderId>${OrderId}</ser:OrderId> 
                        <ser:VPosMessage> 
                            <ser:APIVersion>TDV2.0.0</ser:APIVersion> 
                            <ser:InstallmentMaturityCommisionFlag>0</ser:InstallmentMaturityCommisionFlag> 
                            <ser:HashData>${hashedData}</ser:HashData> 
                            <ser:MerchantId>${SANAL_POS.merchant_id}</ser:MerchantId> 
                            <ser:SubMerchantId>0</ser:SubMerchantId> 
                            <ser:CustomerId>${SANAL_POS.customer_id}</ser:CustomerId> 
                            <ser:UserName>${SANAL_POS.username}</ser:UserName> 
                            <ser:CardType>VISA</ser:CardType> 
                            <ser:BatchID>0</ser:BatchID> 
                            <ser:TransactionType>SaleReversal</ser:TransactionType> 
                            <ser:InstallmentCount>0</ser:InstallmentCount> 
                            <ser:Amount>${Amount}</ser:Amount> 
                            <ser:CancelAmount>${Amount}</ser:CancelAmount> 
                            <ser:DisplayAmount>${Amount}</ser:DisplayAmount> 
                            <ser:MerchantOrderId>test</ser:MerchantOrderId> 
                            <ser:FECAmount>0</ser:FECAmount> 
                            <ser:CurrencyCode>0949</ser:CurrencyCode> 
                            <ser:QeryId>0</ser:QeryId> 
                            <ser:DebtId>0</ser:DebtId> 
                            <ser:SurchargeAmount>0</ser:SurchargeAmount> 
                            <ser:SGKDebtAmount>0</ser:SGKDebtAmount> 
                            <ser:TransactionSecurity>1</ser:TransactionSecurity> 
                        </ser:VPosMessage> 
                    </ser:request> 
                </ser:SaleReversal> 
            </soapenv:Body> 
        </soapenv:Envelope>
    `;

    try {
        const response = await axios.post('https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/SaleReversal', xmlMessage, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });

        // Handle the response as needed
        console.log('SaleReversal response:', response.data);
        res.send(response.data);
    } catch (error) {
        console.error('Error processing SaleReversal:', error);
        res.status(500).send('Error processing SaleReversal');
    }
};


// Export the functions for use in other modules
module.exports = {
    processPayment,
    processApproval,
    processFailure,
    handlePaymentFulfillment,
    processSaleReversal,
};
