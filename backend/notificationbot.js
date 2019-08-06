const utils = require('./utils')
const Config = require('./config')
const fs = require('fs')
const { Client, PrivateKey } = require('eftg-dsteem')

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = 'mongodb://localhost:27017/'+Config.DATABASE;
utils.log(url)

var _mongoClient;
var db;
var state = {
  last_block: 356170
}
var products = []

var steemClient = RPCnode_initClient()

async function connectDB(url) { 
  if (!_mongoClient){
    _mongoClient = await MongoClient.connect(url, { useNewUrlParser: true });
    db = _mongoClient.db(Config.DATABASE)
  }

  return { 
    db: _mongoClient.db(Config.DATABASE),
    client: _mongoClient
  };
}

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
  state = JSON.parse(content)
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
  if(op[1].to !== Config.ACCOUNT) return
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

  confirmPurchase( product, op[1].from ).then( (result)=>{
    utils.log(`Confirmation sent to @${op[1].from} for product "${product.name}"`)
  }).catch((e)=>{utils.log(e.message)})
}

async function confirmPurchase( product, buyer ){
  var data = {
    product: product.name,
    buyer: buyer
  }

  var operation = [
    'custom_json',
    {
      required_auths: [],
      required_posting_auths: [Config.ACCOUNT],
      id: Config.CONFIRMATION_PAYMENT_ID_NAME,
      json: JSON.stringify(data)
    }
  ]
  return await steemClient.broadcast.sendOperations([operation], PrivateKey.fromString(Config.POSTING_KEY))
}

async function main(){
  await connectDB(url)

  loadState()
  products = await getProductsByOwner(Config.ACCOUNT)

  var gpo = await steemClient.database.call('get_dynamic_global_properties')
  utils.log(`Current block: ${gpo.head_block_number}`)
  utils.log(`Last block processed: ${state.last_block}`)

  var i = 0
  while(true){
    if(i%20 == 0) gpo = await steemClient.database.call('get_dynamic_global_properties')

    var block_num = state.last_block + 1
    var block = await steemClient.database.call('get_block',[block_num])

    if(block){
      notifyBlock( block )
      state.last_block = block_num
      saveState()
    }else{
      utils.log(`block ${block_num} does not exist yet. Waiting 3 seconds`)
    }

    if(gpo.head_block_number <= block_num)
      await delay(3000)

    i++
  }
}

main()

