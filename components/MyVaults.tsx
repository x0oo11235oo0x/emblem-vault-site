import { Box, Flex, Text, Link, Image, Stack, Spinner, useColorMode, Button } from '@chakra-ui/core'
import Loader from 'react-loader'
import Refreshing from './Refreshing'
import { useRouter } from 'next/router'
import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import { EMBLEM_API } from '../constants'
import InfiniteScroll from 'react-infinite-scroll-component';
import Embed from './Embed'

export default function MyVaults() {
  const { query } = useRouter()
  const [pagePosition, setPagePosition] = useState(Number(query.start) || 0)
  const { account, chainId } = useWeb3React()
  const [vaults, setVaults] = useState([])
  const [state, setState] = useState({ loaded: false })
  const [loadingApi, setLoadingApi] = useState(false)
  const [address, setAddress] = useState(query.address)
  const [vaultType, setVaultType] = useState(query.type || "unclaimed")
  const [experimental, setExperimental] = useState(query.experimental)
  const { colorMode } = useColorMode()
  const [shouldFetchData, setShouldFetchData] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const PAGE_SIZE = 20

  const getVaults = async () => {
    try {
      const response = await fetch(EMBLEM_API + '/myvaults/'+(address ? address : account)+'?start='+offset+'&size='+PAGE_SIZE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          service: 'evmetadata',
          chainId: chainId.toString(),
          vaultType: vaultType.toString()
        },
      })
      let jsonData = await response.json()    
      setVaults(vaults.concat(jsonData))
      setState({ loaded: true })
      setLoadingApi(false)
      console.log("Records received", jsonData.length)
      if (jsonData.length < PAGE_SIZE) {
        setHasMore(false)
      }
    } catch (error) {}
  }

  const fetchData = async() =>{
    console.log(offset, PAGE_SIZE, offset+PAGE_SIZE)
    setOffset(offset+PAGE_SIZE)
    setShouldFetchData(true)
  }

  const more = ()=>{
    if (location.href.includes('start')) {
      location.href = location.href.replace('start='+pagePosition, 'start='+(pagePosition + PAGE_SIZE))
    } else {
      location.href = location.href + '?start='+(pagePosition + PAGE_SIZE)
    }
    // setPagePosition(pagePosition + PAGE_SIZE)
    // getVaults()
  }

  const less = ()=>{
    if (pagePosition - PAGE_SIZE < 0) {
      setPagePosition(PAGE_SIZE)
    }
    if (location.href.includes('start')) {
      location.href = location.href.replace('start='+pagePosition, 'start='+(pagePosition - PAGE_SIZE))
    } else {
      location.href = location.href + '?start='+(pagePosition - PAGE_SIZE)
    }
    // setPagePosition(pagePosition + 3)
    // getVaults()
  }

  const loadCache = () => {
    let vaults = JSON.parse(localStorage.getItem((address ? address : account) + '_' + chainId + '_newest')) // Load vaults from storage before updating from server!
    if (vaults) {
      setState({ loaded: true })
      setVaults(vaults)
      setLoadingApi(true)
    }
  }

  const saveCache = (vaults) => {
    localStorage.setItem((address ? address : account) + '_' + chainId + '_newest', JSON.stringify(vaults)) // Save new state for later
  }

  const [acct, setAcct] = useState('')
  useEffect(() => {
    if (account && acct != account) {
      setAcct(account)
      setState({ loaded: false })
      getVaults()
    }
  }, [account, acct])

  const [chain, setChain] = useState(chainId)
  useEffect(() => {
    if (chainId && chain != chainId) {
      setChain(chainId)
      setState({ loaded: false })
      getVaults()
    }
  }, [chainId, chain])

  const showOrHideNavLink = (path: string)=> {
    return vaultType == path ? true: false
  }

  const handleNewNavigationClick = (path)=>{
    if (!address) {
      location.href = location.origin + location.pathname + "?type=" + path
    } else {
      location.href = location.origin + location.pathname + "?address=" + address + "&type=" + path
    }
  }

  const handleNftsNavigationClick = ()=>{
    if (!address) {
      location.href = location.origin + '/nfts'
    } else {
      location.href = location.origin + '/nfts' + "?address=" + address
    }
  }

  useEffect(() => {
    if (shouldFetchData) {
      setShouldFetchData(false)
      getVaults()
    } else {
    }
  }, [shouldFetchData])

  return (
    <>
    <Stack pl="10" spacing={0} direction="row">
      <Button isDisabled={showOrHideNavLink('unclaimed')} m={2} variant="ghost" onClick={()=>{handleNewNavigationClick('unclaimed')}}>
          Unclaimed
      </Button>
      <Button isDisabled={showOrHideNavLink('curated')} m={2} variant="ghost" onClick={()=>{handleNewNavigationClick('curated')}}>
          Curated
      </Button>
      <Button isDisabled={showOrHideNavLink('claimed')} m={2} variant="ghost" onClick={()=>{handleNewNavigationClick('claimed')}}>
          Claimed
      </Button>
      <Button isDisabled={showOrHideNavLink('unminted')} m={2} variant="ghost" onClick={()=>{handleNewNavigationClick('unminted')}}>
          Not Minted
      </Button>
      <Button isDisabled={showOrHideNavLink('created')} m={2} variant="ghost" onClick={()=>{handleNewNavigationClick('created')}}>
          Created by me
      </Button>
      <Button isDisabled={false} m={2} variant="ghost" onClick={()=>{handleNftsNavigationClick()}}>
          Other NFT's
      </Button>
    </Stack>
    <Loader loaded={state.loaded}>
      {loadingApi ? <Refreshing /> : ''}
        
        <InfiniteScroll                
          className="infinite-scroll"
          scrollableTarget="shannon-container"
          // height={200}
          dataLength={vaults.length} //This is important field to render the next data
          next={fetchData}
          hasMore={hasMore}
          loader={<Refreshing />}
          endMessage={
            <p style={{ textAlign: 'center' }}>
              <b>No more vaults to load.</b> 
            </p>
          }
        >
      <Flex w="100%" justify="center" flexWrap="wrap" mt={10}>        
        {vaults.length ? (
          vaults.map((vault, index) => {
            let pieces = location.pathname.split('/')
            pieces.pop()
            let url = location.origin + pieces.join('/') + '/nft?id=' + vault.tokenId
            const flexSettings = {
              flex: '1',
              minW: '200px',
              maxW: '200px',
              borderWidth: '1px',
              // color: 'white',
              mx: '6',
              mb: '6',
              rounded: 'lg',
              overflow: 'hidden',
              borderColor: vault.status == 'claimed' ? 'green !important' : '',
              cursor: 'pointer',
            }
            const redirect = function () {
              setLoadingApi(true)
              location.href = url
            }
            return (
              <Link href={url} className="vaultLink">
                <Box className="NFT newest" key={index} {...flexSettings} onClick={redirect}>
                  <Text fontWeight="semibold" textAlign="center" mt={2} pl={2} isTruncated={true}>
                    {vault.name}
                    {!vault.private && vault.totalValue > 0 ? ': ~$' + vault.totalValue : null}
                  </Text>
                  <Stack align="center">
                    <Embed className="d-block w-100 NFT-newest-image" url={vault.image}/>
                  </Stack>
                  <Box d="flex" alignItems="baseline">
                    {/* <Box color="gray.500" fontWeight="semibold" letterSpacing="wide" fontSize="sm" ml="2">
                      {vault.private ? (
                        <>
                          <Text>Contents hidden. Click to view the vault and unlock values.</Text>
                        </>
                      ) : vault.values.length ? (
                        vault.values.map((coin, index) => {
                          if (index < 4)
                            return (
                              <Stack> 
                                <CoinBalance colorMode={colorMode} coin={coin}/>  
                              </Stack>
                            )
                          else if (index == 4)
                            return (
                              <Text fontWeight="bold" mt={2}>
                                ... Click to see the rest ...
                              </Text>
                            )
                        })
                      ) : (
                        <Text>
                          Nothing in here! <br />
                          Click to fill 'er up!
                        </Text>
                      )}
                    </Box> */}
                  </Box>
                  {/* <Box d="flex" alignItems="baseline">
                    <Box color="gray.500" fontWeight="semibold" letterSpacing="wide" fontSize="sm" ml="2">
                      <Text>
                        Total Computable Value: {vault.totalValue}
                      </Text>
                    </Box>
                    </Box> */}
                  <Stack align="center" mt={3}>
                    {vault.status == 'claimed' ? <Text color="green.500">CLAIMED</Text> : null}
                  </Stack>
                </Box>
              </Link>
            )
          })
          
        ) : (
          <Text>
            YOU DON'T SEEM TO HAVE ANY VAULTS.{' '}
            <Link color="#638cd8" href="../create">
              CREATE ONE HERE!
            </Link>
          </Text>
        )}
        
      </Flex>
      </InfiniteScroll>
    </Loader>
    </>
  )
}
