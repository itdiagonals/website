import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
// import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'
import Products from "../../components/products"
import S3Theme from "../../components/s3theme"
import CrossPlayer1 from "../../components/CrossPlayer1"
// import config from "@/payload.config";
import "./globals.css";

import NewArrival from "@/src/modules/NewArrival";

export default async function HomePage() {
  // const headers = await getHeaders()
  // const payloadConfig = await config
  // const payload = await getPayload({ config: payloadConfig })
  // const { user } = await payload.auth({ headers })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`;

  return (
    <>
      <div>
        <NewArrival />
        <CrossPlayer1 />
        <Products />
      </div>
    </>
  );
}
