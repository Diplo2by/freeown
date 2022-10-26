import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import { nftaddress, nftmarketaddress } from '../config'


export default function MyAssets() {
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')
    useEffect(
        () => {
            loadNfts()
        }, [])
    async function loadNfts() {
        const web3modal = new Web3Modal()
        const conn = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(conn)
        const signer = provider.getSigner()

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
    if (loadingState === 'loaded' && !nfts.length) return (
        <h1 className='px-20 py-10 text-3xl'>Looks you don't own any NFTs yet:( Start your spending spree today:))</h1>
    )
    return(
        <div className='flex justify-center'>
            <div className='p-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
                    {
                        nfts.map((nft,i)=>(
                           <div key={i} className='border shadow rouned-xl overflow-hidden'>
                               <img src={nft.image} className='rounded'/>
                               <div className='p-4 bg-black'>
                                   <p className='text-2xl font-bold text-white'>
                                       Price - {nft.price} FOS
                                   </p>
                               </div>
                           </div> 
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
