#!/usr/bin/env node


import { Command } from 'commander';

async function main() {
  const program = new Command();

  program
    .argument('<function>', 'Function that you wanna call on MultiSigWallet contract')
    .option(
      '-f, --function <name>',
      'Function that you wanna call on MultiSigWallet contract'
    )
    .parse();
      
  const url = program.args;
  console.log(url);
  const options = program.opts();
      
  console.log(`url: ${url}, iteration: ${options.iteration}`);
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}