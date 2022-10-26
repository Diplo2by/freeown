// import styles from '../styles/Home.module.css'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import { nftaddress, nftmarketaddress } from '../config'


export default function Myapp({ Component, pageProps }) {
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')
    useEffect(() => {
        loadNFTs()
    }, [])
    async function loadNFTs() {
        const provider = new ethers.providers.JsonRpcProvider()
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
        const data = await marketContract.fetchMarketItems()

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const metadata = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(String(i.price), 'ether')
            let item = {
                price,
                tokenId: Number(i.tokenId),
                seller: i.seller,
                owner: i.owner,
                image: metadata.data.image,
                name: metadata.data.name,
                description: metadata.data.description,
            }
            return item
        }))
        setNfts(items)
        setLoadingState('loaded')
    }

    async function buyNft(nft) {
        const web3modal = new Web3Modal()
        const conn = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(conn)

        const signer = provider.getSigner()
        const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

        const price = ethers.utils.parseUnits(String(nft.price), 'ether')

        const transction = await contract.createMarketSale(nftaddress, nft.tokenId, {
            value: price
        })
        await transction.wait()

        loadNFTs()

    }



    if (loadingState === 'loaded' && !nfts.length) return (
        <h1 className='px-20 py-10 text-3xl'>Aww looks like we are sold out for today :((</h1>
    )

    return (
        <div className='flex justify-center'>
            <div className='px-4' style={{ maxWidth: '1600px' }}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
                    {
                        nfts.map((nft, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nft.image} />
                                <div className='p-4'>
                                    <p style={{ height: '64px' }} className="text-2xl font-semibold">
                                        {nft.name}
                                    </p>
                                    <div style={{ height: '70px', overflow: 'hidden' }}>
                                        <p className='text-gray-400'>
                                            {nft.description}
                                        </p>
                                    </div>
                                </div>
                                <div className='p-4 bg-black'>
                                    <p className='text-2xl mb-4 font-bold text-white'>
                                        {nft.price}
                                    </p>
                                    <button className='w-full bg-pink-500 text-white font-bold py-2 px-12 rounded' onClick={() => buyNft(nft)}>Buy</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
