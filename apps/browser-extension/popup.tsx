import { useState } from "react"

function IndexPopup() {
  const [userId, setUserId] = useState("")
  const [query, setQuery] = useState("")

  return (
    <div
      style={{
        padding: 16
      }}>
      <h2>
        Smara Extension
      </h2>
      <p>Your personal memory space</p>
      <p>Enter user id:</p>
      <input onChange={(e) => setUserId(e.target.value)} value={userId} />
      <p>Query:</p>
      <input onChange={(e) => setQuery(e.target.value)} value={query} />
      <button onClick={() => {
        console.log(userId, query)
      }}>Search</button>
    </div>
  )
}

export default IndexPopup