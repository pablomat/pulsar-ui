const utils = require('./utils')
const Config = require('./config')
const fs = require('fs')
const { Client, PrivateKey } = require('eftg-dsteem')

var state = {
  last_block: 645000
}
var products = []

var steemClient = RPCnode_initClient()

function RPCnode_initClient(address = Config.RPC_NODES[0]) {
  let opts = {}
  opts.addressPrefix = Config.STEEM_ADDRESS_PREFIX
  opts.timeout = Config.DSTEEM_TIMEOUT
  if(Config.STEEM_CHAIN_ID) opts.chainId = Config.STEEM_CHAIN_ID
  return new Client(address, opts)
}

function loadState(){
  if( !fs.existsSync(Config.STATE_FILE) ) return
  content = fs.readFileSync(Config.STATE_FILE, 'utf8')
  try{
    state = JSON.parse(content)
  }catch(error){
    utils.log(`Problems reading ${Config.STATE_FILE} file. ${error.message}`)
  }
}

function saveState(){
  var content = JSON.stringify(state)
  fs.writeFile(Config.STATE_FILE, content, (err)=>{if(err) utils.log('Error saving state. '+err.message)})
}

async function getProductsByOwner(owner){
  var products = []
  try{
    var owner_posts = await steemClient.database.call('get_discussions_by_blog',[{tag:owner, limit:50}])
    owner_posts.forEach( (p)=>{
      if(!p.json_metadata || p.json_metadata.length==0) return
      var metadata = JSON.parse(p.json_metadata)
      if(metadata.product && metadata.description){
        products.push({
          issuer: p.author,
          name: metadata.product,
          price: utils.stringToAsset(metadata.price),
          description: metadata.description
        })
      }
    })
  }catch(error){utils.log(error)}
  return products
}

const delay = (duration) => new Promise(resolve => setTimeout(resolve, duration));

function notifyBlock(block){
  block.transactions.forEach( (trx, index)=>{
    trx.operations.forEach( (operation)=>{
      notifyOperation( operation )
    })
  })
}

function notifyOperation( operation ){
  checkPayment( operation )
}

function checkPayment( op ){
  if(op[0] !== 'transfer') return
  if(!Config.LOOK_ACCOUNTS.find( (a)=>{return a === op[1].to} )) return
  var issuer = op[1].to
  utils.log(`transfer of ${op[1].amount} from @${op[1].from}. Memo: ${op[1].memo}`)
  var product = products.find( (p)=>{ return op[1].memo.toLowerCase() === p.name.toLowerCase() })
  if(!product){
    utils.log(`No product found. No refund scheduled. Please review this transfer`)
    return
  }
  var transfer = utils.stringToAsset(op[1].amount)
  if(transfer.currency !== product.price.currency){
    utils.log(`The transfer should be in ${product.price.currency}. No refund scheduled. Please review this transfer`)
    return
  }
  var _refund = transfer
  _refund.amount = _refund.amount - product.price.amount
  if(_refund.amount < 0){
    utils.log(`Insufficient amount. Required: ${utils.assetToString(product.price)}. No refund scheduled. Please review this transfer`)
    return
  }
  if(_refund.amount > 0){
    utils.log(`Price: ${utils.assetToString(product.price)}. Transfer with extra ${utils.assetToString(_refund)}. The transfer will be processed but no refund is scheduled. Please review this transfer`)
  }

  confirmPurchase( issuer, product, op[1].from ).then( (result)=>{
    utils.log(`Confirmation sent to @${op[1].from} for product "${product.name}"`)
  }).catch((e)=>{utils.log(e.message)})
}

async function confirmPurchase( issuer, product, buyer ){
  var data = {
    product: product.name,
    buyer: buyer
  }

  var operation = [
    'custom_json',
    {
      required_auths: [],
      required_posting_auths: [issuer],
      id: Config.CONFIRMATION_PAYMENT_ID_NAME,
      json: JSON.stringify(data)
    }
  ]
  var password = PrivateKey.fromLogin(issuer, Config.ACTIVE_KEY, 'owner').toString().substring(0,15)
  var postingKey = PrivateKey.fromLogin(issuer, password, 'posting')
  return await steemClient.broadcast.sendOperations([operation], postingKey)
}

async function main(){
  loadState()
  for(var i=0; i<Config.LOOK_ACCOUNTS.length; i++){
    prods = await getProductsByOwner(Config.LOOK_ACCOUNTS[i])
    prods.forEach( (p)=>{ products.push(p) } )
  }
  utils.log(`Account: ${Config.ACCOUNT}`)

  var gpo = await steemClient.database.call('get_dynamic_global_properties')
  utils.log(`Current block: ${gpo.head_block_number}`)
  utils.log(`Last block processed: ${state.last_block}`)

  var i = 0
  var sync = {
    last_message: 'no sync',
    time_last_message: 0,
  }
  while(true){
    if(i%20 == 0) gpo = await steemClient.database.call('get_dynamic_global_properties')

    var block_num = state.last_block + 1
    var block = await steemClient.database.call('get_block',[block_num])

    if(block){
      notifyBlock( block )
      state.last_block = block_num
      saveState()
    }else{
      utils.log(`block ${block_num} does not exist yet`)
    }

    diff_sync = gpo.head_block_number - state.last_block
    if(diff_sync <= 1){
      await delay(3000)
      if(sync.last_message === 'no sync'){
        utils.log(`Synchronized with the blockchain. Block ${gpo.head_block_number}. Time: ${gpo.time}`)
        sync.last_message = 'sync'
        sync.time_last_message = new Date().getTime()
      }
    }else{
      if(sync.last_message === 'sync'){
        utils.log(`Not synchronized. Head block ${gpo.head_block_number} (${gpo.time}). Last checked block ${state.last_block}. Diff of ${diff_sync} blocks.`)
        sync.last_message = 'no sync'
        sync.time_last_message = new Date().getTime()
      }else if(new Date().getTime() - sync.time_last_message >= 3*1000){
        utils.log(`Syncing. Head block ${gpo.head_block_number} (${gpo.time}). Last checked block ${state.last_block}. Diff of ${diff_sync} blocks.`)
        sync.time_last_message = new Date().getTime()
      }
    }

    i++
  }
}

main()

