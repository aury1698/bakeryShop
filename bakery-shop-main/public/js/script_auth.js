//FUNZIONI PER PAGINA INIZIALE "indexProva.html": forse metti lì questo script

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

loginButtonElement.addEventListener("click", async () => {
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

// /* Funzione per il login con metamask */
metamaskButtonElement.addEventListener("click", async () => {
    showDialog({ type: "warning", title: "Login in progress", message: "Please connect your MetaMask wallet." });
    try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        currentPublicAddress = accounts[0];
        usedMetamask = true;
        closeDialog();
        window.location.href = './owner.html';          
        // // Controlla se l'utente è il proprietario del contratto
        // if (currentPublicAddress.toLowerCase() === ownerContractAddress.toLowerCase()) {
        //    window.location.href = './owner.html';          
        // }else {   
        //     window.location.href = './customer.html';      
        // }
    } catch (error) {
        showDialog({ type: "error", title: "Login error", message: "MetaMask wallet not connected." });
        console.log(error);
    }
});


