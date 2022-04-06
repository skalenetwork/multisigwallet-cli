#!/usr/bin/env node

import { promises as fs } from "fs";
import { Command, OptionValues } from "commander";
import * as dotenv from "dotenv";
import * as path from "path";
import { Contract, ethers } from "ethers";

dotenv.config();


function camelToSnakeCase(str: string) {
    return str.split(/(?=[A-Z])/).join('_').toLowerCase();
}

async function getMarionette() {
    const predeployed = await getAbi("data/predeployed.json");
    return new ethers.Contract(
        predeployed["marionette_address"],
        predeployed["marionette_abi"]
    );
}

async function getMultiSigWallet(globalOptions: OptionValues) {
    const privateKey = process.env[`PRIVATE_KEY_${globalOptions.account}`];
    const provider = new ethers.providers.JsonRpcProvider(process.env.ENDPOINT);
    const signer = new ethers.Wallet(privateKey).connect(provider);
    const predeployed = await getAbi("data/predeployed.json");
    return new ethers.Contract(
        predeployed["multi_sig_wallet_address"],
        predeployed["multi_sig_wallet_abi"],
        signer
    );
}

async function getAbi(filepath: string) {
    const rootDir = path.resolve("./");
    const abiFileName = path.join(rootDir, filepath);
    const abi = JSON.parse(await fs.readFile(abiFileName, "utf-8"));
    return abi;
}

async function getDestinationContract(contractName: string, options: OptionValues): Promise<Contract> {
    let destinationContractAddress: string;
    let destinationContractAbi: any;
    if (options.custom) {
        const deployed = await getAbi("data/" + process.env.ABI);
        destinationContractAddress = deployed[`${camelToSnakeCase(contractName)}_address`];
        destinationContractAbi = deployed[`${camelToSnakeCase(contractName)}_abi`];
    } else {
        const predeployed = await getAbi("data/predeployed.json");
        destinationContractAddress = predeployed[`${camelToSnakeCase(contractName)}_address`];
        destinationContractAbi = predeployed[`${camelToSnakeCase(contractName)}_abi`];
    }

    let destinationContract: Contract;
    try {
        destinationContract = new ethers.Contract(
            destinationContractAddress,
            destinationContractAbi
        )
    } catch (e) {
        console.log(`Contract with name "${contractName}" does not exist`);
    }
    return destinationContract;
}

function showLogs(receipt: any) {
    console.log("--------------EVENTS--------------")
    for (let event of receipt.events) {
        if (event.event != undefined) {
            console.log(`${event.event}(${event.args})`);
        }
    }
    console.log("----------------------------------")
    console.log(`Gas used: ${receipt.gasUsed}`)
    console.log(`Tx hash: ${receipt.transactionHash}`)
}

async function getTypes(contractName: string, functionName: string, options: OptionValues) {
    let destinationContractAbi: any;
    if (options.custom) {
        const deployed = await getAbi("data/" + process.env.ABI);
        destinationContractAbi = deployed[`${camelToSnakeCase(contractName)}_abi`];
    } else {
        const predeployed = await getAbi("data/predeployed.json");
        destinationContractAbi = predeployed[`${camelToSnakeCase(contractName)}_abi`];
    }
    const types: Array<string> = [];
    for (let func of destinationContractAbi) {
        if (func.name == functionName) {
            for (let output of func.outputs) {
                types.push(output.type);
            }
        }
    }
    return types;
}

async function main() {
    const program = new Command();

    program
        .option('-a, --account <number>', "Account number from which you wanna perform a transaction", "1")
        .option(
            "--custom",
            "For custom abi, set filepath to ABI into .env"
        )
        .allowUnknownOption()
        .parse()

    const globalOptions = program.opts();

    if (!process.env.ABI && globalOptions.custom) {
        console.log("Set path to file with ABI and addresses to ABI environment variables");
        return;
    }

    program
        .command('encodeData')
        .argument('<schainName>', "Destination schain name")
        .argument('<contract>', "Destination contract that you wanna call")
        .argument('<func>', "Function that you wanna call on the destination contract")
        .argument('[params...]', "Arguments for the destination function that you wanna call on the contract")
        .description('Returns encoded data for interaction with schain through gnosis safe on mainnet')
        .action(async (schainName, contract, func, params) => {
            const marionette = await getMarionette();
            const destinationContract = await getDestinationContract(contract, globalOptions);
            const postOutgoingMessageAbi = await getAbi("data/ima_mainnet.json");
            const postOutgoingMessageInterface = new ethers.utils.Interface(postOutgoingMessageAbi["message_proxy_mainnet_abi"]);
            const schainHash = ethers.utils.solidityKeccak256(["string"], [schainName]);
            const encodedData = postOutgoingMessageInterface.encodeFunctionData(
                "postOutgoingMessage",
                [
                    schainHash,
                    marionette.address,
                    ethers.utils.defaultAbiCoder.encode(["address", "uint", "bytes"], [
                        destinationContract.address,
                        0,
                        destinationContract.interface.encodeFunctionData(
                            func,
                            params
                        )
                    ])
                ]
            );
            console.log(encodedData)
        });

    program
        .command('call')
        .argument('<contract>', "Destination contract that you wanna call")
        .argument('<func>', "Function that you wanna call on the destination contract")
        .argument('[params...]', "Arguments for the destination function that you wanna call on the contract")
        .description("Returns the result of executing the transaction, using call.")
        .action(async (contract, func, params) => {
            const destinationContract = await getDestinationContract(contract, globalOptions);
            const provider = new ethers.providers.JsonRpcProvider(process.env.ENDPOINT);
            const result = (await provider.call({
                to: destinationContract.address,
                data: destinationContract.interface.encodeFunctionData(
                    func,
                    params
                )
              })).slice(2);
            const types = await getTypes(contract, func, globalOptions);
            for (let i = 0; i < types.length; i++) {
                const slicedResult = "0x" + result.substring(i*64, (i+1)*64);
                if (types[i] == "uint256") {
                    console.log(Number(slicedResult));
                } else if (types[i] == "address") {
                    console.log("0x" + slicedResult.substring(26));
                } else if (types[i] == "bool") {
                    console.log(Boolean(Number(slicedResult)));
                } else {
                    console.log(slicedResult)
                }
            }
        });

    program
        .command('recharge')
        .argument('<amount>', "Amount of money in wei")
        .description("Allows to recharge the balance of the MultiSigWallet contract")
        .action(async (amount) => {
            const privateKey = process.env[`PRIVATE_KEY_${globalOptions.account}`];
            const provider = new ethers.providers.JsonRpcProvider(process.env.ENDPOINT);
            const signer = new ethers.Wallet(privateKey).connect(provider);
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            await (await signer.sendTransaction({
                to: multiSigWallet.address,
                value: ethers.utils.parseUnits(amount, "wei")
            })).wait();
            const multiSigWalletBalance = await provider.getBalance(multiSigWallet.address).then(res => res.toString());
            console.log(`MultiSigWallet balance: ${multiSigWalletBalance} wei`)
        });

    program
        .command('submitTransaction')
        .argument('<contract>', "Destination contract that you wanna call")
        .argument('<func>', "Function that you wanna call on the destination contract")
        .argument('[params...]', "Arguments for the destination function that you wanna call on the contract")
        .option('-w, --wei [amount]', "Amount of money in wei", "0")
        .description('Allows an owner to submit and confirm a transaction.')
        .action(async (contract, func, params, options) => {
            const marionette = await getMarionette();
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            let receipt: any;
            if (contract == "MultiSigWallet") {
                receipt = await (await multiSigWallet.submitTransaction(
                    multiSigWallet.address,
                    0,
                    multiSigWallet.interface.encodeFunctionData(
                        func,
                        params
                    ),
                    { gasLimit: 3000000 }
                )).wait();
            } else if (contract == "Marionette" && func == "sendEth") {
                receipt = await (await multiSigWallet.submitTransaction(
                    marionette.address,
                    params[1],
                    marionette.interface.encodeFunctionData(
                        func,
                        params
                    ),
                    { gasLimit: 3000000 }
                )).wait();
            } else {
                const destinationContract = await getDestinationContract(contract, globalOptions);
                receipt = await (await multiSigWallet.submitTransaction(
                    marionette.address,
                    options.wei,
                    marionette.interface.encodeFunctionData(
                        "execute",
                        [
                            destinationContract.address,
                            options.wei,
                            destinationContract.interface.encodeFunctionData(
                                func,
                                params
                            )
                        ]
                    ),
                    { gasLimit: 3000000 }
                )).wait();
            }
            showLogs(receipt);
        });

    program
        .command('submitTransactionWithData')
        .argument('<contractAddress>', "Destination contract that you wanna call")
        .argument('<data>', "Encoded data of function selector and params")
        .description('Allows an owner to submit and confirm a transaction with custom data.')
        .action(async (contractAddress, data) => {
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            const marionette = await getMarionette();
            let receipt: any;
            receipt = await (await multiSigWallet.submitTransaction(
                marionette.address,
                0,
                marionette.interface.encodeFunctionData(
                    "execute",
                    [
                        contractAddress,
                        0,
                        data
                    ]
                ),
                { gasLimit: 3000000 }
            )).wait();
            showLogs(receipt);
        });

    program
        .command('confirmTransaction')
        .argument('<transactionId>', "Transaction id")
        .description('Allows an owner to confirm a transaction.')
        .action(async (transactionId) => {
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            const receipt = await (await multiSigWallet.confirmTransaction(transactionId, { gasLimit: 3000000 })).wait();
            showLogs(receipt);
        });

    program
        .command('revokeConfirmation')
        .argument('<transactionId>', "Transaction id")
        .description('Allows an owner to revoke a confirmation for a transaction.')
        .action(async (transactionId) => {
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            const receipt = await (await multiSigWallet.revokeConfirmation(transactionId, { gasLimit: 3000000 })).wait();
            showLogs(receipt);
        });

    program
        .command('executeTransaction')
        .argument('<transactionId>', "Transaction id")
        .description('Allows you to execute a confirmed transaction.')
        .action(async (transactionId) => {
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            const receipt = await (await multiSigWallet.executeTransaction(transactionId, { gasLimit: 3000000 })).wait();
            showLogs(receipt);
        });

    program
        .command('getConfirmations')
        .argument('<transactionId>', "Transaction id")
        .description('Returns array with owner addresses, which confirmed transaction.')
        .action(async (transactionId) => {
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            console.log(await multiSigWallet.getConfirmations(transactionId))
        });

    program
        .command('getConfirmationCount')
        .argument('<transactionId>', "Transaction id")
        .description('Returns number of confirmations of a transaction.')
        .action(async (transactionId) => {
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            console.log((await multiSigWallet.getConfirmationCount(transactionId)).toNumber());
        });

    program
        .command('isConfirmed')
        .argument('<transactionId>', "Transaction id")
        .description('Returns the confirmation status of a transaction.')
        .action(async (transactionId) => {
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            console.log(await multiSigWallet.isConfirmed(transactionId));
        });

    program
        .command('getTransactionIds')
        .argument('[transactionId]', "Transaction id")
        .description('Returns status of transactions.')
        .action(async (transactionId) => {
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            const transactionCount = await multiSigWallet.transactionCount();
            const pending = (await multiSigWallet.getTransactionIds(0, transactionCount, true, false)).map((x) => x.toNumber());
            const executed = (await multiSigWallet.getTransactionIds(0, transactionCount, false, true)).map((x) => x.toNumber());
            const transactions = [];
            for (let i = 0; i < transactionCount; i++) {
                let tx = {};
                tx["id"] = i;
                tx["pending"] = false;
                tx["executed"] = false;
                if (pending.includes(i)) {
                    tx["pending"] = true;
                }
                if (executed.includes(i)) {
                    tx["executed"] = true;
                }
                transactions.push(tx);
            }
            if (transactionId == undefined) {
                console.table(transactions)
            } else {
                console.table([transactions[transactionId]])
            }
        });

    program
        .command('getOwners')
        .description('Returns list of owners.')
        .action(async () => {
            const multiSigWallet = await getMultiSigWallet(globalOptions);
            console.log(await multiSigWallet.getOwners())
        });

    program
        .command('getBalance')
        .argument('<address>', "The address of which you wanna know the balance")
        .description("Returns the balance of address.")
        .action(async (address) => {
            const provider = new ethers.providers.JsonRpcProvider(process.env.ENDPOINT);
            console.log(await provider.getBalance(address).then(res => res.toString()));
        });


    await program.parseAsync();


}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}