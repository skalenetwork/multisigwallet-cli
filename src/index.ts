#!/usr/bin/env node

import { promises as fs } from "fs";
import { Command } from "commander";
import * as dotenv from "dotenv";
import * as path from "path";
import { Contract, ethers } from "ethers";

dotenv.config();


function camelToSnakeCase(str: string) {
    return str.split(/(?=[A-Z])/).join('_').toLowerCase();
}


async function main() {
    const program = new Command();

    program
        .argument("<contract>", "Contract that you wanna call")
        .argument("<function>", "Function that you wanna call on the contract")
        .option(
            "--custom",
            "For custom abi, set filepath to ABI into .env"
        )
        .parse(process.argv);

    const contractName = program.args[0];
    const functionName = program.args[1];
    const params = program.args.slice(2);
    const options = program.opts();
    
    const privateKey = process.env.PRIVATE_KEY;
    const endpoint = process.env.ENDPOINT;

    if (!process.env.ABI && options.custom) {
        console.log("Set path to file with ABI and addresses to ABI environment variables");
        return;
    }

    const deployedFilename = path.join(__dirname, "../data/" + process.env.ABI);
    const deployed = JSON.parse(await fs.readFile(deployedFilename, "utf-8"));
    const predeployedFilename = path.join(__dirname, "../data/predeployed.json");
    const predeployed = JSON.parse(await fs.readFile(predeployedFilename, "utf-8"));


    const wallet = new ethers.Wallet(privateKey);
    const provider = new ethers.providers.JsonRpcProvider(endpoint);
    const signer = wallet.connect(provider);


    const multiSigWallet = new ethers.Contract(
        predeployed["multi_sig_wallet_address"],
        predeployed["multi_sig_wallet_abi"],
        signer
    )

    const marionette = new ethers.Contract(
        predeployed["marionette_address"],
        predeployed["marionette_abi"],
        signer
    )

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
            destinationContractAbi,
            signer
        )
    } catch (e) {
        console.log(`Contract with name "${contractName}" does not exist`);
    }

    const result = await multiSigWallet.submitTransaction(
        predeployed["marionette_address"],
        0,
        marionette.interface.encodeFunctionData(
            "execute",
            [
                destinationContractAddress,
                0,
                destinationContract.interface.encodeFunctionData(
                    functionName,
                    params
                )
            ]
        ),
        {gasLimit: 3000000}
    )

    console.log(result);


}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}