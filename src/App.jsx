import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Page from './Page.jsx'
import Sidebar from './Sidebar.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div class="App">
      <Sidebar />
      <Page />
    </div>
  )
}

export default App
