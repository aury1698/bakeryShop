// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract BakeryShop is ERC721, Ownable {

    enum ProductType {Coffee, Croissant, Muffin, Donut, Bagel, Cupcake, Brownie}
    struct Product {
        string name;
        uint256 price;
        uint256 quantity; 
    }

    mapping(ProductType => Product) public products;
    
    mapping(ProductType => uint256[]) private productTypeToTokenIds; //PROVA FORSE TOGLIERE
    
    uint256 public nextTokenId;
    address public ownerContract = 0x8D6502e277f47AfCE132da7e89c7E58D4E25641b;
    event ProductPurchased(address indexed buyer, ProductType productId, uint256 quantity, uint256 tokenId, uint256 changeReturned);
    event ProductRestocked(ProductType productId, uint256 quantity);
    event LotteryResult(address indexed buyer, string result);
    //event ProductPurchasedPROVA(address indexed buyer, ProductType productId, uint256 quantity, uint256 tokenId);
    event ChangeOwnership(string messaggio);

    constructor(address _owner) ERC721("BakeryShopNFT", "BSNFT") Ownable(_owner) {

        // Inizializza i prodotti con i loro prezzi fissi e una quantità iniziale
        uint256 initialQuantity = 2;  
        mintProduct(ProductType.Coffee, "Coffee", 290000000000000 wei, initialQuantity); //€0.96
        mintProduct(ProductType.Croissant, "Croissant", 490000000000000 wei, initialQuantity); //€1.63
        mintProduct(ProductType.Muffin, "Muffin", 1600000000000000 wei, initialQuantity); //€5.32
        mintProduct(ProductType.Donut, "Donut", 1100000000000000 wei, initialQuantity); //€3.66
        mintProduct(ProductType.Bagel, "Bagel", 650000000000000 wei, initialQuantity); //€2.16
        mintProduct(ProductType.Cupcake, "Cupcake", 810000000000000 wei, initialQuantity); //€2.69
        mintProduct(ProductType.Brownie, "Brownie", 1300000000000000 wei, initialQuantity); //€4.32
    }

    function mintProduct(ProductType _type, string memory _name, uint256 _price, uint256 _quantity) private {
        require(_quantity > 0, "Quantity must be greater than zero");
        
        Product storage product = products[_type];
        product.name = _name;
        product.price = _price;
        product.quantity += _quantity; 

        for (uint256 i = 0; i < _quantity; i++) {
            _safeMint(ownerContract, nextTokenId);
            productTypeToTokenIds[_type].push(nextTokenId); // PROVA: Aggiunge l'ID del token al mapping
            nextTokenId++;
        }
    }

    function getTotalProducts() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < uint256(ProductType.Brownie) + 1; i++) {
            total += products[ProductType(i)].quantity;
        }
        return total;
    }

    function getProductInfo(ProductType _type) external view returns (string memory, uint256, uint256) {
        require(_type >= ProductType.Coffee && _type <= ProductType.Brownie, "Invalid product type");
        Product memory product = products[_type];
        return (product.name, product.price, product.quantity);
    }

    function getRandomNumber(uint256 _max) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % _max;
    }

    function getLotteryResult() private view returns (bool) {
        uint256 randomNumber = getRandomNumber(100);
        if (randomNumber < 10) {
            return true; // L'utente ha vinto
        } else {
            return false; // L'utente non ha vinto
        }
    }

    function returnChange(uint256 amountPaid, uint256 amountRequired) internal returns (uint256) {
        if(amountPaid > amountRequired) {
            uint256 changeAmount = amountPaid - amountRequired;
            payable(msg.sender).transfer(changeAmount); // Restituisce il resto al cliente
            return changeAmount;
        }
        return 0;
    }

    function purchaseProduct(ProductType _type, uint256 _quantity) external payable {
        require(_quantity > 0, "Quantity must be greater than zero");
        require(products[_type].quantity >= _quantity, "Product out of stock");
        uint256 totalPrice = products[_type].price * _quantity;
        require(msg.value >= totalPrice, "Insufficient funds");

        uint256 change = returnChange(msg.value, totalPrice);
        uint256 tokenId;

        //Poi togli:
        for (uint256 i = 0; i < _quantity; i++) {
            tokenId = getNextAvailableTokenId(_type);
            _transfer(ownerContract, msg.sender, tokenId);
        }

        products[_type].quantity -= _quantity;


        emit ProductPurchased(msg.sender, _type, _quantity, tokenId, change);
        // Controlla il risultato della lotteria e assegna la colazione gratuita se l'utente ha vinto
        awardFreeBreakfast(msg.sender);
    }

    function getNextAvailableTokenId(ProductType _type) private returns (uint256) {
        require(productTypeToTokenIds[_type].length > 0, "No tokens left for this product type");
        uint256 tokenId = productTypeToTokenIds[_type][0]; // Prende il primo token ID disponibile per il tipo di prodotto

        // Rimuove l'ID del token dall'array
        for (uint256 i = 0; i < productTypeToTokenIds[_type].length - 1; i++) {
            productTypeToTokenIds[_type][i] = productTypeToTokenIds[_type][i + 1];
        }
        productTypeToTokenIds[_type].pop(); // Rimuove l'ultimo elemento dopo lo spostamento per evitare che venga selezionato di nuovo

        return tokenId;
    }

    function removeFirstElement(uint256[] storage array) private returns (uint256[] storage) {
        require(array.length > 0, "Array is empty");
        for (uint256 i = 0; i < array.length - 1; i++) {
            array[i] = array[i + 1];
        }
        array.pop();
        return array;
    }
    
    //PROVA
    function awardFreeBreakfast(address _winner) internal {
        bool hasWon = getLotteryResult();
        if (hasWon) {
            emit LotteryResult(_winner, "Congratulations! You have won a free breakfast!");
            awardProduct(_winner, ProductType.Croissant);
            awardProduct(_winner, ProductType.Coffee);
        } else {
            emit LotteryResult(_winner, "Better luck next time!");
        }
    }

    function awardProduct(address _winner, ProductType _type) private {
        if (products[_type].quantity > 0) {
            uint256 tokenId = getNextAvailableTokenId(_type);
            _transfer(ownerContract, _winner, tokenId);
            products[_type].quantity--;
        } else {
            restockProduct(_type, 1);
            uint256 tokenId = getNextAvailableTokenId(_type);
            _transfer(ownerContract, _winner, tokenId);
            products[_type].quantity--;
        }
    }

    function restockProduct(ProductType _type, uint256 _quantity) private {
        require(_quantity > 0, "Quantity must be greater than zero");
        for (uint256 i = 0; i < _quantity; i++) {
            _safeMint(ownerContract, nextTokenId);
            products[_type].quantity += 1;
            productTypeToTokenIds[_type].push(nextTokenId);
            nextTokenId++;
        }
    }

    // Funzione wrapper pubblica per restock
    function restockProductExternal(ProductType _type, uint256 _quantity) external onlyOwner {
        restockProduct(_type, _quantity);
    }
}