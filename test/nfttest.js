const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function () {
    it("Should create and execute market sales", async function () {
        const Market = await ethers.getContractFactory("NFTMarket")
        const market = await Market.deploy()
        await market.deployed()
        const marketAddress = market.address

        const NFT = await ethers.getContractFactory("NFT")
        const nft = await NFT.deploy(marketAddress)
        await nft.deployed()
        const nftContractAddress = nft.address


        let listingPrice = await market.getListingPrice()
        listingPrice = String(listingPrice)

        const auctionPrice = ethers.utils.parseUnits('100', 'ether')
        await nft.createToken("https://www.diplosnft.com")
        await nft.createToken("https://www.darshansnft.com")

        await market.createMarketItem(nftContractAddress, 1, auctionPrice, { value: listingPrice })
        await market.createMarketItem(nftContractAddress, 2, auctionPrice, { value: listingPrice })


        const [_, buyerAddress] = await ethers.getSigners()

        await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, { value: auctionPrice })

        let items = await market.fetchMarketItems()
        items = await Promise.all(items.map(async i => {
            const tokenUri = await nft.tokenURI(i.tokenId)
            let item = {
                price: String(i.price),
                tokenId: String(i.tokenId),
                seller: i.seller,
                owner: i.owner,
                tokenUri
            }
            return item
        }))
        console.log('Items:', items)
    });
});