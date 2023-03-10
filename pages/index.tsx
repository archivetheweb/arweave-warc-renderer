import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import logo from "../public/logo.png";
import moment from "moment";
import axios from "axios";

export default function Replay() {
  const router = useRouter();
  const [data, setData] = useState({
    data: { url: "", originalURL: "", timestamp: 0, depth: 0, arweaveTx: "" },
    isLoading: true,
    error: "",
    sourceURL: "",
  });
  const [listURL, setListURL] = useState(false);

  useEffect(() => {
    let tx = router.query.tx as string;
    if (!tx) {
      setData({
        ...data,
        isLoading: false,
        error:
          "No tx field set. Make sure you set a tx field in the url (i.e url.com?tx=<TX_ID>)",
      });
      return;
    }

    (async () => {
      try {
        // this is to play well with firefox
        let source = await axios.head(`https://arweave.net/${tx}/data.warc`);
        let info = await axios.post("https://arweave.net/graphql", {
          operationName: "getTransactions",
          query: query,
          variables: { ids: [tx] },
        });
        let data = info.data.data.transactions.edges;
        if (data.length == 0) {
          setData({
            ...data,
            isLoading: false,
            error:
              "Could not find bundle information for tx " +
              tx +
              ". Please try again",
          });
          return;
        }
        let tags = data[0].node.tags;
        let depth = 0;
        let timestamp = 0;
        let originalURL = "";
        let url = "";
        console.log(tags);
        for (let tag of tags) {
          switch (tag.name) {
            case "Crawl-Depth":
              depth = +tag.value;
              break;
            case "Url":
              url = tag.value;
              break;
            case "Original-Url":
              originalURL = tag.value;
              break;
            case "Timestamp":
              timestamp = +tag.value;
              break;
          }
        }
        setData({
          data: {
            url,
            originalURL: originalURL,
            depth,
            timestamp,
            arweaveTx: tx,
          },
          isLoading: false,
          error: "",
          sourceURL: source.request.responseURL,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [router.query.tx]);

  return (
    <div>
      {!data.isLoading && data.error && (
        <div className="flex flex-col h-screen w-full ">
          <div className="flex justify-center content-center items-center h-full">
            <div className="flex-col justify-center content-center items-center">
              Error: {data.error}
            </div>
          </div>
        </div>
      )}
      {data.isLoading || data.error ? (
        <div></div>
      ) : (
        <div className="flex flex-col h-screen w-full ">
          <div
            className="grid grid-cols-2 md:grid-cols-3 p-8 items-center w-full  border-b border-[#00000033] "
            style={{ color: "rgba(0, 0, 0, 0.6)" }}
          >
            <div className="flex gap-8  ">
              <div className="flex justify-center content-center items-center">
                <Link href={"/"}>
                  <img
                    src={
                      "https://arweave.net/1PGyJAWqd6JCc66byIgSj7_8LuNLo33DY8mwWDWymrs"
                    }
                    alt="logo"
                    style={{
                      maxHeight: "41px",
                      maxWidth: "140px",
                      minHeight: "30px",
                      minWidth: "100px",
                    }}
                  />
                </Link>
              </div>
            </div>
            <div className="flex flex-col  ">
              <div>
                Snapshot taken:{" "}
                <span className="font-bold">
                  {moment(data.data?.timestamp * 1000).format(
                    "MMMM D YYYY [at] HH:mm:ss"
                  )}
                </span>
              </div>
              <div>
                Snapshot of:{" "}
                <Link
                  className="underline"
                  href={processURL(data.data?.originalURL)}
                  target="_blank"
                >
                  {data.data?.originalURL}
                </Link>
              </div>
              <div>
                <Link
                  className="underline"
                  href={
                    "https://viewblock.io/arweave/tx/" + data.data?.arweaveTx
                  }
                  target="_blank"
                >
                  View on Arweave
                </Link>{" "}
              </div>
              <div>
                {" "}
                <div className="flex gap-3">
                  <span>List URLs</span>
                  <input
                    type="checkbox"
                    className="toggle bg-funpurple"
                    checked={listURL}
                    onClick={() => setListURL(!listURL)}
                  />
                </div>
              </div>
            </div>
            <div className=" justify-end hidden md:flex">
              <a
                href={"https://archivetheweb.com/url?url=" + data.data.url}
                target="_blank"
                rel={"noreferrer"}
                className="btn w-fit justify-end bg-funpurple normal-case  text-[#FFFFFF] hover:bg-funpurple/75 border-none"
              >
                See all snapshots of this site
              </a>
            </div>
          </div>

          <div className="w-full h-full flex justify-center flex-col items-center ">
            <replay-web-page
              source={data.sourceURL}
              url={listURL ? "" : processURL(data.data.originalURL)}
              embed="replayonly"
              replayBase={
                window.location.host.includes("localhost")
                  ? "/replay/"
                  : window.location.pathname + "/replay/"
              }
            ></replay-web-page>
          </div>
        </div>
      )}
    </div>
  );
}

let query = `query getTransactions($ids: [ID!], $owners: [String!], $recipients: [String!], $tags: [TagFilter!], $bundledIn: [ID!], $block: BlockFilter, $first: Int = 10, $after: String, $sort: SortOrder = HEIGHT_DESC) {
  transactions(
    ids: $ids
    owners: $owners
    recipients: $recipients
    tags: $tags
    bundledIn: $bundledIn
    block: $block
    first: $first
    after: $after
    sort: $sort 
  ) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        block {
          height
          id
          timestamp
        }
        recipient
        owner {
          address
          key
        }
        fee {
          winston
          ar
        }
        quantity {
          winston
          ar
        }
        tags {
          name
          value
        }
        data {
          size
          type
        }
        bundledIn {
          id
        }
      }
    }
  }
}
`;

export const processURL = (url: string) => {
  url = url.toLowerCase();
  if (url.includes("www.")) {
    url = url.replace("www.", "");
  }

  if (!new RegExp(/^(https:\/\/)/).test(url)) {
    url = "https://" + url;
  }

  if (url.endsWith("/")) {
    url = url.substring(0, url.length - 1);
  }

  return url;
};
