const crypto = require('crypto');
const axios = require('axios');

// Configuration for the Kuveyt Turk Virtual POS (Sanal POS)
const SANAL_POS = {
    customer_id: '400235',
    merchant_id: '496',
    username: 'apitest',
    password: 'api123',
    ok_url: 'http://127.0.0.1:3000/ok-url',
    fail_url: 'http://127.0.0.1:3000/fail-url',
    kart_onay_url: 'https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelPayGate',
    odeme_onay_url: 'https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelProvisionGate',
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

// Function to create a SHA-1 hash of the given data string and return it in base64 format
const createHashedData = (dataString) => {
    return Buffer.from(
        crypto.createHash('sha1').update(dataString, 'utf-8').digest()
    ).toString('base64');
};

// Function to process a payment
const processPayment = async (req, res) => {
    const { name, expiry, number, cvc } = req.body;
    const [month, year] = expiry.split('/').map(part => part.trim());
    const merchantOrderId = 'web-odeme';
    const tutar = 5 * 100;

    const hashedPassword = createHashedData(SANAL_POS.password);
    const hashString = `${SANAL_POS.merchant_id}${merchantOrderId}${tutar}${SANAL_POS.ok_url}${SANAL_POS.fail_url}${SANAL_POS.username}${hashedPassword}`;
    const hashedData = createHashedData(hashString);

    // Create the XML message to be sent to the payment gateway
    const xmlMessage = `<KuveytTurkVPosMessage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <APIVersion>1.0.0</APIVersion>
        <OkUrl>${SANAL_POS.ok_url}</OkUrl>
        <FailUrl>${SANAL_POS.fail_url}</FailUrl>
        <HashData>${hashedData}</HashData>
        <MerchantId>${SANAL_POS.merchant_id}</MerchantId>
        <CustomerId>${SANAL_POS.customer_id}</CustomerId>
        <UserName>${SANAL_POS.username}</UserName>
        <CardNumber>${number}</CardNumber>
        <CardExpireDateYear>${year}</CardExpireDateYear>
        <CardExpireDateMonth>${month}</CardExpireDateMonth>
        <CardCVV2>${cvc}</CardCVV2>
        <CardHolderName>${name}</CardHolderName>
        <CardType>Troy</CardType>
        <TransactionType>Sale</TransactionType>
        <InstallmentCount>0</InstallmentCount>
        <Amount>${tutar}</Amount>
        <DisplayAmount>${tutar}</DisplayAmount>
        <CurrencyCode>0949</CurrencyCode>
        <MerchantOrderId>${merchantOrderId}</MerchantOrderId>
        <TransactionSecurity>3</TransactionSecurity>
    </KuveytTurkVPosMessage>`;

    try {
        const result = await sendPostRequest(SANAL_POS.kart_onay_url, xmlMessage);
        res.send(result);
    } catch (error) {
        res.status(500).send('Error processing payment');
    }
};

// Function to process the approval of a payment
const processApproval = async (req, res) => {
    const { AuthenticationResponse } = req.body; // Extract the authentication response from the request body
    const data = decodeURIComponent(AuthenticationResponse); // Decode the response

    // Extract various fields from the response using regular expressions
    const merchantOrderId = data.match(/<MerchantOrderId>(.*?)<\/MerchantOrderId>/)[1];
    const amount = data.match(/<Amount>(.*?)<\/Amount>/)[1];
    const md = data.match(/<MD>(.*?)<\/MD>/)[1];

    const hashString = `${SANAL_POS.merchant_id}${merchantOrderId}${amount}${SANAL_POS.username}${createHashedData(SANAL_POS.password)}`;
    const hashedData = createHashedData(hashString);

    const xmlMessage = `<KuveytTurkVPosMessage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <APIVersion>1.0.0</APIVersion>
        <HashData>${hashedData}</HashData>
        <MerchantId>${SANAL_POS.merchant_id}</MerchantId>
        <CustomerId>${SANAL_POS.customer_id}</CustomerId>
        <UserName>${SANAL_POS.username}</UserName>
        <TransactionType>Sale</TransactionType>
        <InstallmentCount>0</InstallmentCount>
        <Amount>${amount}</Amount>
        <MerchantOrderId>${merchantOrderId}</MerchantOrderId>
        <TransactionSecurity>3</TransactionSecurity>
        <KuveytTurkVPosAdditionalData>
            <AdditionalData>
                <Key>MD</Key>
                <Data>${md}</Data>
            </AdditionalData>
        </KuveytTurkVPosAdditionalData>
    </KuveytTurkVPosMessage>`;

    try {
        const result = await sendPostRequest(SANAL_POS.odeme_onay_url, xmlMessage);
        res.send(result);
    } catch (error) {
        res.status(500).send('Error processing approval');
    }
};

// Function to handle payment failures
const processFailure = (req, res) => {
    res.send('Payment failed');
};

// Export the functions for use in other modules
module.exports = {
    processPayment,
    processApproval,
    processFailure,
};
