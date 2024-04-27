const ganacheTestnet= "http://localhost:8545"; //per GANACHE
const testnet = "https://rpc2.sepolia.org/";
const web3 = new Web3(new Web3.providers.HttpProvider(testnet));
const contractAddress = "0x75A4F6c124B14063E67aD337Cca69cE2b4786Df9";
let myContract;

// //per GANACHE--> PER PRENDERE INDIRIZZO CONTRATTO ETC VEDI NICO DA "let firstBlockHash in poi"


let currentPublicAddress = "";
let usedMetamask = false;
let currentPrivateKey = "";
let privateKey = "c69104ba0ebae11fc50ca9ef4455e7beca84b8fcc104931b599a0e410c12c8ba";

// Seleziona l'elemento del bottone "Login with MetaMask" e l'elemento del bottone "Login with Private Key"
const ownerContractAddress = "0x8D6502e277f47AfCE132da7e89c7E58D4E25641b";
const inputPrivateKeyElement = document.querySelector("#private-key");
const metamaskButtonElement = document.getElementById('metamask-button');
const loginButtonElement = document.getElementById('login-button');
const dialogElement = document.querySelector("#dialog");
//const restockButtonElement = document.querySelector("#restock-button");
const totalProductsButtonElement = document.querySelector("#total-products-button");
const restockButtons = document.querySelectorAll('.restock-button');

//PROVA per mettere nel carosello l'ultimo acquirente con l'acquisto fatto
let lastPurchasedAddresses = []; //PROVA! Array per salvare gli indirizzi degli ultimi acquirenti
let lastPurchasedProducts = []; //PROVA! Array per salvare i tipi di prodotti acquistati
let lastPurchasedQuantities = []; //PROVA! Array per salvare le quantità di prodotti acquistati


async function updateProductInfo(contract) {
    try {
        // Itera attraverso ogni box_container
        const boxContainers = document.querySelectorAll('.box_container');
        for (let i = 0; i < boxContainers.length; i++) {
            const boxContainer = boxContainers[i];
            
            // Ottieni il tipo di prodotto dall'indice i
            const productType = i; // Assumendo che gli indici corrispondano ai tipi di prodotto (0-6)

            // Ottieni le informazioni sul prodotto dal contratto Solidity
            const productInfo = await contract.methods.getProductInfo(productType).call();

            // Aggiorna l'HTML con le informazioni ottenute
            const productNameElement = boxContainer.querySelector('.product-name');
            productNameElement.textContent = productInfo[0];

            const productPriceElement = boxContainer.querySelector('.product-price');
            productPriceElement.textContent = `${web3.utils.fromWei(productInfo[1], 'ether')} ETH`;

            const productQuantityElement = boxContainer.querySelector('.product-quantity');
            productQuantityElement.textContent = `Available quantity: ${productInfo[2]}`;
        }
    } catch (error) {
        console.error("Error while updating product info:", error);
    }
}

// Inizializza il contratto e aggiorna le informazioni sui prodotti all'avvio
async function initContract() {
    try {
        const contractJsonInterface = await fetch("/public/json/ContractInterface.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Errore di rete nel caricamento del file JSON');
                }
                return response.json();
            });

        myContract = new web3.eth.Contract(contractJsonInterface, contractAddress);
        console.log(myContract);
        console.log(myContract.methods);

        
        // Aggiorna le informazioni sui prodotti al caricamento della pagina
        await updateProductInfo(myContract);
        //await isOwner(myContract);
        
        return myContract;
    } catch (error) {
        console.error('Error:', error);
    }
    
}

initContract();
// At the end of your script
updateCarousel(lastPurchasedAddresses, lastPurchasedProducts, lastPurchasedQuantities);

// Inizializza il contratto e aggiorna le informazioni sui prodotti all'avvio
async function getContract() {
    myContract = await initContract();
}


//!!! PURCHASE DEL PRODOTTO!!! //

//Funzione per avere restituito il prezzo del prodotto
async function getProductPrice(productType) {
    try {
        const productInfo = await myContract.methods.getProductInfo(productType).call();
        return productInfo[1];
    } catch (error) {
        console.error("Error while getting product price:", error);
    }
}


async function purchaseProduct(productType, quantity) {
    try {
        // Connect MetaMask and get the user's account
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const currentPublicAddress = accounts[0];

        // Get myContract if it hasn't been initialized yet
        if (!myContract) {
            myContract = await getContract();
        }

        // Get the product price in Wei
        const productPriceWei = await getProductPrice(productType);

        // Convert the quantity to a BigInt
        const quantityBigInt = BigInt(quantity);

        // Calculate the total price
        const totalPrice = productPriceWei * quantityBigInt;

        // Convert the total price to a string and then to Wei
        const totalPriceWei = web3.utils.toWei(totalPrice.toString(), 'wei');


        // Create the transaction
        const transaction = {
            from: currentPublicAddress,
            to: contractAddress,
            data: myContract.methods.purchaseProduct(productType, quantity).encodeABI(),
            value: totalPriceWei
        };

        // Send the transaction
        ethereum.request({ method: 'eth_sendTransaction', params: [transaction] })
        .then(txHash => {
            console.log("Product purchased successfully:", txHash);

            lastPurchasedAddresses.push(currentPublicAddress); //PROVA: aggiungo l'indirizzo dell'ultimo acquirente
            lastPurchasedProducts.push(productType);
            lastPurchasedQuantities.push(quantity);
            updateCarousel(lastPurchasedAddresses, lastPurchasedProducts, lastPurchasedQuantities); // Update the function call


            // Create a set to store the hashes of processed transactions
            const processedTransactions = new Set();
        
            // Every second, check if the transaction has been mined
            const interval = setInterval(async () => {
                const receipt = await web3.eth.getTransactionReceipt(txHash);
                if (receipt && !processedTransactions.has(receipt.transactionHash)) {
                    clearInterval(interval);
                    console.log("Receipt:", receipt);
        
                    // Add the transaction hash to the set of processed transactions
                    processedTransactions.add(receipt.transactionHash);
        
                    // Get the logs from the receipt
                    const logs = receipt.logs;
        
                    // Filter the logs to only include 'LotteryResult' events
                    const lotteryResultLogs = logs.filter(log => log.topics[0] === web3.utils.keccak256('LotteryResult(address,string)'));
        
                    // Decode the logs
                    for (let i = 0; i < lotteryResultLogs.length; i++) {
                        const log = lotteryResultLogs[i];
                        // Find the event definition in the contract's jsonInterface
                        const eventLotteryResult = myContract.options.jsonInterface.find(definition => definition.type === 'event' && definition.name === 'LotteryResult');
        
                        // Decode the log
                        const decodedLog = web3.eth.abi.decodeLog(eventLotteryResult.inputs, log.data, log.topics.slice(1));
                        console.log("Decoded log:", decodedLog);
        
                        console.log("Message from event:", decodedLog.result);
                        // Show the dialog with the message
                        showLotteryDialog(decodedLog.result);
                    }
        
                    // Update product info after purchase
                    await updateProductInfo(myContract);
                }
            }, 1000);
        })
    .catch(error => {
        console.error("Error while purchasing product:", error);
    });

    } catch (error) {
        console.error("Error while purchasing product:", error);
    }
}

//PROVA per mettere nel carosello l'ultimo acquirente
// Trova tutti gli elementi con classe "detail_box" all'interno del carousel
function updateCarousel(lastPurchasedAddresses, lastPurchasedProducts, lastPurchasedQuantities) {
    // Trova tutti gli elementi con classe "detail_box" all'interno del carousel
    const detailBoxes = document.querySelectorAll('#carouselExample2Indicators .detail_box');

    // Itera su ciascun elemento "detail_box" e aggiungi le informazioni sull'ultimo acquisto
    detailBoxes.forEach((detailBox, index) => {

        // Define a mapping from product type numbers to names
        const productNames = ['Coffee', 'Croissant', 'Muffin', 'Donut', 'Bagel', 'Cupcake', 'Brownie']; // Replace with your actual product names


        const address = lastPurchasedAddresses[index] || 'No client ';
        const productQuantity = lastPurchasedQuantities[index] || 'anything';
        const productType = productNames[lastPurchasedProducts[index]] || 'yet.';
        
        // Aggiungi le informazioni all'elemento "detail_box"
        detailBox.innerHTML = `
            <h5>${address}</h5>
            <p> ${address} has bought ${productQuantity} ${productType}</p>
        `;
    });
}



const buyButtons = document.querySelectorAll('.buy-button');
buyButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const productType = parseInt(button.dataset.productType); // Ottieni il tipo di prodotto dal dataset
        const quantityInput = button.parentElement.querySelector('.buy-quantity');
        const quantity = parseInt(quantityInput.value); // Ottieni la quantità dalla casella di input

        // Richiedi l'account che ha cliccato il bottone
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const currentPublicAddress = accounts[0];
        console.log("Current public address:", currentPublicAddress);  
        //simulatePurchase(productType, quantity, currentPublicAddress); //decommenta per usare la funzione di simulazione
        
        //Chiamata alla funzione di acquisto con il tipo di prodotto e la quantità desiderata
        purchaseProduct(productType, quantity, currentPublicAddress).then(() => {
            // Aggiorna le info dei prodotti 
            updateProductInfo(myContract).then(() => {console.log("Product info updated")} );
        });
        
    });
});



//USA QUESTA FUNZIONE per SIMULARE la vincita/non vincita della lotteria a seguito dell'acquisto 
//Per mostrare come viene graficamente il dialog SENZA spendere Ether!

// async function simulatePurchase(productType, quantity, currentPublicAddress) {
//     try {
//         // Genera casualmente un numero tra 0 e 99
//         const randomNumber = Math.floor(Math.random() * 100);

//         // Definisci una soglia per determinare se l'utente ha vinto o meno
//         const winThreshold = 10; // 10%

//         // Determina se l'utente ha vinto o meno in base al numero casuale generato
//         const hasWon = randomNumber < winThreshold;

//         // Messaggio di vincita o sconfitta
//         let message = "";

//         if (hasWon) {
//             message = "Congratulations! You won the lottery! You have won a free breakfast!";
//         } else {
//             message = "Better luck next time!";
//         }

//         // Mostra il dialog con il messaggio
//         showLotteryDialog(message);

//         // Aggiorna le informazioni sul prodotto dopo l'acquisto (questa parte potrebbe essere opzionale)
//         await updateProductInfo(myContract);

//     } catch (error) {
//         console.error("Error while simulating purchase:", error);
//     }
// }


//!!!FINE PURCHASE PRODOTTI!!!


//Qui metterai funzione per CAROSELLO CLIENTI //


//crea funzione che stampa il totale dei prodotti quando viene cliccato il bottone corrispondente

document.addEventListener('DOMContentLoaded', (event) => {
    // Assicurati che l'ID dell'elemento esista nel DOM di questa pagina
    if(totalProductsButtonElement) {
        totalProductsButtonElement.addEventListener('click', async () => {
            const totalProducts = await myContract.methods.getTotalProducts().call();
            console.log("Total products:", totalProducts);
            //alert("Total products: " + totalProducts);
            //Custom Alert 
            Swal.fire({
                title: 'Total products',
                text: totalProducts.toString(),
                //imageUrl: 'https://img.freepik.com/vettori-gratuito/illustrazione-di-cupcake-alla-fragola_24908-81873.jpg?t=st=1714201735~exp=1714205335~hmac=016661f2e1da8f636694cdac9dbcd3753a94f3718a7de36acee8a8e5101ea4e4&w=1380',
                imageUrl: 'images/alert_image.png', //immagine da mettere nel dialog 
                imageWidth: 200,
                imageHeight: 200,
                confirmButtonText: 'OK',
                width: '400px'
              });
        });
    } else {
        // L'elemento non esiste in questa pagina
        console.log('Il bottone per il totale dei prodotti non esiste in questa pagina.');
    }
});


// !!! RESTOCK PRODUCTS !!! 

async function restockProduct(productType, quantity) {
    try {
        // Connect MetaMask and get the user's account
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const currentPublicAddress = accounts[0];

        // Get myContract if it hasn't been initialized yet
        if (!myContract) {
            myContract = await getContract();
        }

        // Create the transaction
        const transaction = {
            from: currentPublicAddress,
            to: contractAddress,
            value: 0,
            data: myContract.methods.restockProductExternal(productType, quantity).encodeABI()
        };

        // Send the transaction
        ethereum.request({ method: 'eth_sendTransaction', params: [transaction] })
            .then((txHash) => {
                console.log("Product restocked successfully:", txHash);

                // Wait for the transaction to be mined and get the receipt
                if(txHash != null){
                    const getReceipt = async () => {
                        let receipt = null;
                        while (receipt === null) {
                            try {
                                receipt = await web3.eth.getTransactionReceipt(txHash);
                                if (!receipt) {
                                    await new Promise(resolve => setTimeout(resolve, 15000)); // wait for 15 seconds before checking again
                                } else {
                                    console.log("Receipt:", receipt);
                                    updateProductInfo(myContract).then(() => {console.log("Product info updated"); 
                                    //custom alert
                                    Swal.fire({
                                        title: 'Product restocked successfully!',
                                        text: 'The new quantity is now available for purchase.',
                                        icon: "success",
                                        confirmButtonText: 'OK',
                                        width: '400px'
                                      });
                                    } );
                                    // Get the logs from the receipt
                                    const logs = receipt.logs;
                                    console.log("Logs:", logs);

                                    // Filter the logs to only include 'ProductRestocked' events
                                    const restockedLogs = logs.filter(log => log.topics[0] === web3.utils.keccak256('ProductRestocked(uint256,uint256)'));

                                    // Decode the logs
                                    for (let i = 0; i < restockedLogs.length; i++) {
                                        const log = restockedLogs[i];
                                        console.log("ABI:", myContract.options.jsonInterface);
                                        // Trova la definizione dell'evento nel jsonInterface del contratto
                                        const eventRestockProduct = myContract.options.jsonInterface.find(definition => definition.type === 'event' && definition.name === 'ProductRestocked');

                                        // Decodifica il log
                                        const decodedLog = web3.eth.abi.decodeLog(eventRestockProduct.inputs, log.data, log.topics.slice(1));
                                        console.log("Decoded log:", decodedLog);
                                    }
                                }
                            } catch (error) {
                                console.error("Error while getting transaction receipt:", error);
                                await new Promise(resolve => setTimeout(resolve, 15000)); // wait for 5 seconds before checking again
                            }
                        }
                    };
                    getReceipt();
                }

            })
            .catch((error) => {
                console.error("Error while restocking product:", error);
            });

        // // Update product info after restock: FORSE INUTILE
        // await updateProductInfo(myContract);
    
    } catch (error) {
        console.error("Error while restocking product:", error);
    }
}

// Aggiungi un gestore di eventi per il click sui bottoni "Restock"
restockButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const productType = parseInt(button.dataset.productType); // Ottieni il tipo di prodotto dal dataset
    const getAccount = await ethereum.request({ method: 'eth_requestAccounts' });
    currentPublicAddress = getAccount[0];
    // Chiedi all'utente la quantità da restockare tramite un prompt
    if(currentPublicAddress.toLowerCase() === ownerContractAddress.toLowerCase()){
        //const quantityToRestock = prompt("Enter the quantity to restock:");
        const { value: quantityToRestock } = await Swal.fire({
            title: "Enter the quantity to restock",
            input: "number",
            inputLabel: "Quantity",
            inputPlaceholder: "Enter the quantity (number)",
            inputAttributes: {
                min: 1
            },
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return "You need to write something!";
                }
            }
        });
        if (quantityToRestock !== null) {
            // Effettua il restock chiamando la funzione appropriata
            await restockProduct(productType, parseInt(quantityToRestock), currentPublicAddress);
        }
    }else{
        //Custom Alert
        Swal.fire({
            title: 'Only the owner can restock products',
            text: 'Please login as the owner to restock products.',
            icon: "warning",
            confirmButtonText: 'OK',
            width: '400px'
          });
    }
  });
});
//!!!FINE RESTOCK PRODOTTI!!!

// PER AVERE IL RISULTATO DELLA LOTTERIA
document.addEventListener('DOMContentLoaded', () => {

    if(!myContract) {
        myContract = getContract().then(() => { 
    
            // Listen for the LotteryResult event
            myContract.events.LotteryResult({}, (error, event) => {
                console.log("Listening for LotteryResult event");
                if (error) {
                    console.error("Error while listening for LotteryResult event:", error);
                    return;
                }
            
                console.log("LotteryResult event received:", event);
            
                // Get the message from the event
                const message = event.returnValues._message;
            
                console.log("Message from event:", message);
            
                // Show the dialog with the message
                showLotteryDialog(message);
            });
        });
    }
});

function showLotteryDialog(message) {
    // Get the dialog and div elements
    const lotteryDialogDiv = document.getElementById('lottery-dialog-div');
    const lotteryDialogElement = document.getElementById('lottery-dialog');

    // Get the message element
    const messageElement = lotteryDialogElement.querySelector('#lottery-dialog-message');

    // Set the message
    messageElement.textContent = message;

    // Show the dialog and div
    lotteryDialogDiv.style.display = "block";
    lotteryDialogElement.style.display = "block";
}

function closeLotteryDialog() {
    // Get the dialog and div elements
    const lotteryDialogDiv = document.getElementById('lottery-dialog-div');
    const lotteryDialogElement = document.getElementById('lottery-dialog');

    // Hide the dialog and div
    lotteryDialogDiv.style.display = "none";
    lotteryDialogElement.style.display = "none";
}






//FUNZIONI PER PAGINA INIZIALE "indexProva.html"

/* Funzioni per gestire il dialog */
function showDialog({ type, title, message }) {
    //If the dialog is already open, close it and open a new one
    if (dialogElement.open) {
        dialogElement.close();
    }
    dialogElement.classList.remove("error", "warning", "success");
    dialogElement.classList.add(type);
    dialogElement.querySelector("h3").textContent = title;
    dialogElement.querySelector("p").innerHTML = message;
    dialogElement.showModal();

}
function closeDialog() {
    dialogElement.close();
}
//TODO:
//dialogElement.querySelector("button").addEventListener("click", closeDialog); //Close the dialog when the button is clicked, MA DEVO AGGIUNGERE IL BOTTONE

/* Funzione per il login */
async function login(privateKey) {
    showDialog({ type: "warning", title: "Login in progress", message: "Please wait." });
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    currentPublicAddress = account.address;
    currentPrivateKey = privateKey;
    usedMetamask = false;
}


document.addEventListener('DOMContentLoaded', (event) => {
    // Assicurati che l'ID dell'elemento esista nel DOM di questa pagina
    if(loginButtonElement) {
        loginButtonElement.addEventListener('click', async (event) => {
            let privateKey = inputPrivateKeyElement.value;
            //Se la chiave privata non inizia con 0x, la aggiungo
            if (!privateKey.startsWith("0x")) {
                privateKey = "0x" + privateKey;
            }
            try {
                await login(privateKey);
                window.location.href = './owner.html';          
                closeDialog();
            } catch (error) {
                showDialog({ type: "error", title: "Login error", message: error.message });
            }
        });
    } else {
        // L'elemento non esiste in questa pagina
        console.log('Il bottone di login non esiste in questa pagina.');
    }
});

document.addEventListener('DOMContentLoaded', (event) => {
    // Assicurati che l'ID dell'elemento esista nel DOM di questa pagina
    if(metamaskButtonElement) {
        metamaskButtonElement.addEventListener("click", async () => {
            showDialog({ type: "warning", title: "Login in progress", message: "Please connect your MetaMask wallet." });
            try {
                const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                currentPublicAddress = accounts[0];
                usedMetamask = true;
                closeDialog();
                window.location.href = './owner.html';          
            } catch (error) {
                showDialog({ type: "error", title: "Login error", message: "MetaMask wallet not connected." });
                console.log(error);
            }
        });
    } else {
        // L'elemento non esiste in questa pagina
        console.log('Il bottone di login Metamask non esiste in questa pagina.');
    }
});

