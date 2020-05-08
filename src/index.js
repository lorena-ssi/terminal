#!/usr/bin/env node
const Lorena = require('@lorena-ssi/lorena-sdk').default
const Wallet = require('@lorena-ssi/wallet-lib').default

const createWallet = require('./createWallet')
const { importWallet } = require('./manageWallet')

const term = require('./term')
const Commander = require('./Commander')

// Main.
const main = async () => {
  await term.banner('Lorena', 'An awesome framework for Self-Sovereign Identity')
  let username
  let wallet

  // Username
  if (process.argv[2]) {
    try {
      const walletObject = await importWallet(process.argv[2])
      username = Object.keys(walletObject)[0]
      wallet = new Wallet(username)
      await wallet.write('info', walletObject[username].info)
      await wallet.write('data', walletObject[username].data)
      term.info(`Using "${username}" as username\n`)
    } catch (_) {
      term.info(`Error reading "${process.argv[2]}\n`)
    }
  } else {
    username = await term.input('Username')
    wallet = new Wallet(username)
  }

  // Open Wallet and connect to Lorena
  const lorena = new Lorena(wallet, { debug: true, silent: true })
  term.ctrlC(lorena)

  // Password
  const password = await term.input('Password')

  let options = {}
  // Open the Wallet. Create a new one if no wallet available.
  if (await lorena.unlock(password)) {
    term.info('Wallet open')
    await lorena.connect()
  } else if (await term.yesOrNo('Wallet does not exist. Create a new wallet?')) {
    // Creating first link connection
    term.message('Please add information on your fist link:\n')
    const didLink = await term.input('DID (did:lor:labtest:12345)')
    const alias = await term.input('ALIAS (defaultLink)')
    options = { did: didLink, alias }
    // Creating wallet
    term.message(`Let's create your wallet in network ${didLink.split(':')[2]}!\n`)
    await createWallet(didLink.split(':')[2], lorena, password)
    await lorena.connect()
  } else process.exit()

  // React to messages received.
  lorena.on('message:credential-ask', async (payload) => term.message('Received credential', payload))
  lorena.on('message:action-post', async (payload) => term.message('Received action', payload))
  lorena.on('contact-incoming', async (payload) => term.message('Contact invitation Incoming from', payload))
  lorena.on('contact-added', async (payload) => term.message('Contact invitation Accepted from', payload))
  lorena.on('error', (e) => term.error(e))
  lorena.on('ready', async () => {
    term.info('Lorena ^+connected^')

    const commander = new Commander(lorena)
    commander.run(options)
  })
}

main()
