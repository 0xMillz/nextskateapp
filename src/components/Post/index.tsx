"use client"

import PostModel, { PostProps } from "@/lib/models/post"
import UserModel, { UserProps } from "@/lib/models/user"
import {
  Card,
  CardFooter,
  CardHeader,
  Flex,
  Link,
  Stack,
  Text,
  Tooltip,
  useClipboard,
} from "@chakra-ui/react"
import { KeychainSDK, Vote } from "keychain-sdk"
import { Check, Heart, MessageCircle, PiggyBank, Send } from "lucide-react"
import { ReactElement, useState } from "react"
import PostAvatar from "./Avatar"
import PostIcon from "./Icon"
import PostImage from "./Image"

export interface PostComponentProps {
  postData: PostProps
  userData: UserProps
}

export default function Post({
  postData,
  userData,
}: PostComponentProps): ReactElement {
  const post = new PostModel(postData)
  const user = new UserModel(userData)

  const { onCopy, hasCopied } = useClipboard(post.getFullUrl())

  const loggedUserData =
    typeof window !== "undefined" ? localStorage.getItem("hiveuser") : null
  const loggedUser = loggedUserData ? JSON.parse(loggedUserData) : null

  const [isVoted, setIsVoted] = useState(
    !!(loggedUser && loggedUser.name && post.userHasVoted(loggedUser.name))
  )

  const handleVoteClick = async () => {
    if (loggedUser) {
      const voteWeight = isVoted ? 0 : 10000
      const keychain = new KeychainSDK(window)
      await keychain.vote({
        username: loggedUser.name,
        permlink: post.permlink,
        author: post.author,
        weight: voteWeight,
      } as Vote)
      setIsVoted((isVoted) => !isVoted)
    }
  }

  const handleCommentClick = () => {
    console.log("Comments..")
  }

  return (
    <Card
      size="sm"
      boxShadow="none"
      borderRadius="lg"
      _hover={{
        outline: "1px solid",
        outlineColor: "gray.100",
      }}
      mt={2}
    >
      <CardHeader pb={0}>
        <Flex gap="4" align={"end"}>
          <Flex flex="1" gap="2" alignItems="center">
            <Link href={post.getFullAuthorUrl()}>
              <PostAvatar
                name={user.name}
                src={
                  user.metadata?.profile.profile_image ||
                  `https://images.ecency.com/webp/u/${user.name}/avatar/small`
                }
              />
            </Link>
            <Flex flexDir="column" gap={0}>
              <Flex gap={1} alignItems="center">
                <Text fontSize="14px" as="b">
                  {post.author}
                </Text>
                <Text fontSize="14px" color="darkgray">
                  ·
                </Text>
                <Text fontSize="12px" color="darkgray" fontWeight="300">
                  {formatTimeSince(post.created)}
                </Text>
              </Flex>
              <Text fontSize="14px" noOfLines={1}>
                {post.title}
              </Text>
            </Flex>
          </Flex>
          <Tooltip label="Earnings">
            <Flex gap={1} align={"center"}>
              <PiggyBank strokeWidth={"1.5"} color="darkgray" size={"20px"} />
              <Text color={"darkgray"} fontSize={"13px"} fontWeight={"400"}>
                ${post.getEarnings()}
              </Text>
            </Flex>
          </Tooltip>
        </Flex>
      </CardHeader>
      <PostImage
        src={post.getThumbnail()}
        alt={post.title}
        linkUrl={post.getFullUrl()}
      />
      <CardFooter pt={0} flexDirection={"column"} gap={2}>
        <Flex w={"100%"} justify={"space-between"} align={"center"}>
          {getVoters(post)}
          <Stack direction={"row"} gap={1}>
            <PostIcon
              onClick={onCopy}
              icon={hasCopied ? Check : Send}
              label={hasCopied ? "Copied!" : "Copy link"}
              size={6}
            />
            <PostIcon
              onClick={handleCommentClick}
              icon={MessageCircle}
              label="Comments"
              size={6}
            />
            <PostIcon
              onClick={handleVoteClick}
              active={isVoted}
              colorAccent="#ff4655"
              fill={true}
              icon={Heart}
              label="Upvote"
              size={6}
            />
          </Stack>
        </Flex>
      </CardFooter>
    </Card>
  )
}

function formatTimeSince(dateString: string): string {
  const postDate = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - postDate.getTime()

  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 60) {
    return `${minutes}m`
  } else if (hours < 24) {
    return `${hours}h`
  } else {
    const day = postDate.getDate()
    const monthNames: string[] = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ]
    const month = monthNames[postDate.getMonth()]
    return `${day} ${month}`
  }
}

function getVoters(post: PostProps) {
  if (!post.active_votes || !post.active_votes.length)
    return <Text fontSize={"sm"}>No votes</Text>

  const votes = post.active_votes.sort((a, b) => b.reputation - a.reputation)
  const bestReputationVoter: string = votes[0].voter
  const qtdVotes = votes.length - 1

  if (qtdVotes > 1)
    return (
      <Text fontSize={"sm"}>
        Voted by <b>{bestReputationVoter}</b> and <b>{qtdVotes}</b> other
        {qtdVotes > 1 && "s"}
      </Text>
    )

  return (
    <Text fontSize={"sm"}>
      Voted by <Text as="b">{bestReputationVoter}</Text>
    </Text>
  )
}