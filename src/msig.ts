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
    const predeployed = await getAbi("../data/predeployed.json");
    return new ethers.Contract(
        predeployed["marionette_address"],
        predeployed["marionette_abi"]
    );
}

async function getMultiSigWallet(signer: ethers.Wallet) {
    const predeployed = await getAbi("../data/predeployed.json");
    return new ethers.Contract(
        predeployed["multi_sig_wallet_address"],
        predeployed["multi_sig_wallet_abi"],
        signer
    );
}

async function getAbi(filepath: string) {
    const abiFileName = path.join(__dirname, filepath).replace("bin/","");
    const abi = JSON.parse(await fs.readFile(abiFileName, "utf-8"));
    return abi;
}

async function getDestinationContract(contractName: string, options: OptionValues): Promise<Contract> {
    const deployed = await getAbi("../data/" + process.env.ABI);
    const predeployed = await getAbi("../data/predeployed.json");
    let destinationContractAddress: string;
    let destinationContractAbi: any;
    if (options.custom) {
        destinationContractAddress = deployed[`${camelToSnakeCase(contractName)}_address`];
        destinationContractAbi = deployed[`${camelToSnakeCase(contractName)}_abi`];
    } else {
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


async function main() {
    const program = new Command();

    program
        .option('-a, --account <number>', "Account number from which you wanna perform a transaction", "1")
        .option(
            "--custom",
            "For custom abi, set filepath to ABI into .env"
        )
        .parse()

    const options = program.opts();

    const privateKey = process.env[`PRIVATE_KEY_${options.account}`];
    const endpoint = process.env.ENDPOINT;

    if (!process.env.ABI && options.custom) {
        console.log("Set path to file with ABI and addresses to ABI environment variables");
        return;
    }

    const wallet = new ethers.Wallet(privateKey);
    const provider = new ethers.providers.JsonRpcProvider(endpoint);
    const signer = wallet.connect(provider);

    const marionette = await getMarionette();
    const multiSigWallet = await getMultiSigWallet(signer);

    program
        .command('submitTransaction')
        .argument('<contract>', "Destination contract that you wanna call")
        .argument('<func>', "Function that you wanna call on the destination contract")
        .argument('<params...>', "Arguments for the destination function that you wanna call on the contract")
        .description('Allows an owner to submit and confirm a transaction.')
        .action(async (contract, func, params) => {
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
            } else {
                const destinationContract = await getDestinationContract(contract, options);
                receipt = await (await multiSigWallet.submitTransaction(
                    marionette.address,
                    0,
                    marionette.interface.encodeFunctionData(
                        "execute",
                        [
                            destinationContract.address,
                            0,
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
        .command('confirmTransaction')
        .argument('<transactionId>', "Just transaction id")
        .description('Allows an owner to confirm a transaction.')
        .action(async (transactionId) => {
            const receipt = await (await multiSigWallet.confirmTransaction(transactionId, { gasLimit: 3000000 })).wait();
            showLogs(receipt);
        });

    program
        .command('revokeConfirmation')
        .argument('<transactionId>', "Just transaction id")
        .description('Allows an owner to confirm a transaction.')
        .action(async (transactionId) => {
            const receipt = await (await multiSigWallet.revokeConfirmation(transactionId, { gasLimit: 3000000 })).wait();
            showLogs(receipt);
        });

    program
        .command('executeTransaction')
        .argument('<transactionId>', "Just transaction id")
        .description('Allows anyone to execute a confirmed transaction.')
        .action(async (transactionId) => {
            const receipt = await (await multiSigWallet.executeTransaction(transactionId, { gasLimit: 3000000 })).wait();
            showLogs(receipt);
        });

    program
        .command('getOwners')
        .description('Returns list of owners.')
        .action(async () => {
            console.log(await multiSigWallet.getOwners())
        });

    program
        .command('getConfirmations')
        .argument('<transactionId>', "Just transaction id")
        .description('Returns array with owner addresses, which confirmed transaction.')
        .action(async (transactionId) => {
            console.log(await multiSigWallet.getConfirmations(transactionId))
        });

    program
        .command('getConfirmationCount')
        .argument('<transactionId>', "Just transaction id")
        .description('Returns number of confirmations of a transaction.')
        .action(async (transactionId) => {
            console.log((await multiSigWallet.getConfirmationCount(transactionId)).toNumber());
        });

    program
        .command('isConfirmed')
        .argument('<transactionId>', "Just transaction id")
        .description('Returns the confirmation status of a transaction.')
        .action(async (transactionId) => {
            console.log(await multiSigWallet.isConfirmed(transactionId));
        });

    program
        .command('getTransactionIds')
        .argument('[transactionId]', "Transaction id")
        .description('Returns status of transactions.')
        .action(async (transactionId) => {
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