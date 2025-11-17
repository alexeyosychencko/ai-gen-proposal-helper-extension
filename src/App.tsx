import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const welcomeData = useQuery(api.test.getWelcomeMessage)

  return (
    <div className="App">
      <h1>Freelance assistant</h1>
      
      {welcomeData ? (
        <div style={{ padding: '20px', background: '#1a1a1a', borderRadius: '8px' }}>
          <p>✅ {welcomeData.message}</p>
          <p style={{ fontSize: '12px', opacity: 0.7 }}>
            Time: {new Date(welcomeData.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ) : (
        <p>⏳ Convex...</p>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setCount(count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  )
}

export default App