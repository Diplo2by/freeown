import { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from "next/router";
import Web3Modal from 'web3modal'

import{projectId,projectSecret} from '../config.js'

const auth =
    'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = ipfsHttpClient({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
})




import {
    nftaddress, nftmarketaddress
} from '../config'


import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'


export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null)
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
    const router = useRouter()

    async function onChange(e) {
        console.log('Changed lol')
        const file = e.target.files[0]
        try {
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log(`received:${prog}`)
                }
            )
            const url = `https://freeown.infura-ipfs.io/ipfs/${added.path}`
            setFileUrl(url)
        } catch (e) {
            console.log(e)
        }
    }
    async function createItem() {
        const { name, description, price } = formInput
        if (!name || !description || !price || !fileUrl) return
        const data = JSON.stringify({
            name, description, image: fileUrl
        })


        try {
            const added = await client.add(data)
            const url = `https://freeown.infura-ipfs.io/ipfs/${added.path}`
            createSale(url)
        } catch (error) {
            console.log('There was an Error uploading file: ', error)
        }

    }

    async function createSale(url) {
        const web3modal = new Web3Modal()
        const conn = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(conn)
        const signer = provider.getSigner()

        let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
        let transction = await contract.createToken(url)
        let tx = await transction.wait()

        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = Number(value)

        const price = ethers.utils.parseUnits(formInput.price, 'ether')

        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        let listingPrice = await contract.getListingPrice()
        listingPrice = String(listingPrice)

        transction = await contract.createMarketItem(nftaddress, tokenId, price, {
            value: listingPrice
        })

        await transction.wait()
        router.push('/')
    }
    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input
                    placeholder="Name your Asset"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                />
                <textarea
                    placeholder="Describe your Asset"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
                />
                <input
                    placeholder="Asset Price in FOS"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                />
                <input
                    type="file"
                    name="Asset"
                    className="my-4"
                    onChange={onChange}
                />
                {
                    fileUrl && (
                        <img className="rounded mt-4" width="350" src={fileUrl} />
                    )
                }
                <button
                    onClick={createItem}
                    className='font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg'
                >
                    Create an NFT
                </button>
            </div>
        </div>
    )
}

