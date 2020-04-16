const term = require('./term')
const callRecipe = require('./callRecipe')

const runCommand = async (command, autoComplete, lorena, wallet) => {
  /**
   * Shut down the terminal, prompting to save
   */
  const shutdown = async () => {
    if (lorena.wallet.changed === true) {
      term.message('\nSaving changes to the wallet')
      await lorena.lock(await term.input('password'))
    }
    term.message('Good bye!\n\n')
    process.exit()
  }

  const commands = {
    help: () => term.array(autoComplete),
    info: () => term.json(wallet.info),
    credential: async () => {
      const issuer = await term.input('issuer')
      term.json(await wallet.get('credentials', { issuer: issuer }))
    },
    'credential-get': async () => {
      term.info((await callRecipe(lorena, 'credential-get', { credentialType: 'memberOf' })).payload)
    },
    credentials: () => term.json(wallet.data.credentials ? wallet.data.credentials : {}),
    links: () => term.json(wallet.data.links),
    link: async () => {
      const roomId = await term.input('roomId')
      const link = await wallet.get('links', { roomId: roomId })
      term.json(link)
    },
    'link-pubkey': async () => {
      const roomId = await term.input('roomId')
      const link = await wallet.get('links', { roomId: roomId })
      term.info('Public Key ', link.keyPair[link.did].keypair.public_key)
    },
    'link-add': async () => {
      const created = await lorena.createConnection(
        await term.input('DID (did:lor:labtest:12345)'),
        await term.input('Matrix user (@user:labtest.matrix.lorena.tech)'))
      if (created) term.info('Created room', created)
      else term.error('\nError\n')
    },
    'link-member-of': async () => {
      term.info(await lorena.memberOf(
        await term.input('roomId'),
        await term.input('Extra'),
        await term.input('Rolename'))
      )
    },
    'link-member-of-confirm': async () => {
      term.info(await lorena.memberOfConfirm(
        await term.input('roomId'),
        await term.input('Secret code'))
      )
    },
    'link-member-list': async () => { term.json((await callRecipe(lorena, 'member-list', { filter: 'all' })).payload) },
    'link-ping': async () => { term.info((await callRecipe(lorena, 'ping')).payload) },
    'link-ping-admin': async () => { term.info((await callRecipe(lorena, 'ping-admin')).payload) },
    'link-action-issue': async () => {
      await callRecipe(lorena, 'action-issue', {
        did: 'did:lor:labtest:WjNWcFpqRkhWVXQ0TWxkRldqRTBWMUps',
        action: 'la mama',
        description: 'Fer trucada'
      })
      /*      await callRecipe(lorena, 'action-issue', {
          did : await term.gray('DID : ').inputField().promise,
          action : await term.gray('Action : ').inputField().promise,
          description : await term.gray('\nDescription : ').inputField().promise
        }) */
    },
    exit: shutdown,
    q: shutdown,
    default: () => term.info(`Command ${command} does not exist. For help type "help"`)
  }

  term.line()
  if (commands[command]) {
    await commands[command]()
  } else {
    await commands.default()
  }
}

module.exports = runCommand