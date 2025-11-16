'use client'

import { useState } from 'react'
import { Upload, Mail, Loader2, CheckCircle, XCircle, Download } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'scraping' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [message, setMessage] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus('idle')
      setMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file || !email) {
      setMessage('Please select a file and enter your email')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('email', email)

    try {
      setStatus('uploading')
      setMessage('Uploading file and starting scraper...')
      
      const response = await axios.post(`${API_URL}/api/scrape`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setJobId(response.data.job_id)
      setStatus('scraping')
      setMessage('Scraping in progress... This may take 1-2 hours.')
      
      // Start polling for status
      pollStatus(response.data.job_id)
      
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.error || 'Failed to start scraping')
    }
  }

  const pollStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/status/${jobId}`)
        const { status: jobStatus, progress: jobProgress, message: jobMessage } = response.data

        setProgress(jobProgress)
        setMessage(jobMessage)

        if (jobStatus === 'completed') {
          clearInterval(interval)
          setStatus('success')
          setMessage('Scraping completed! Results sent to your email.')
        } else if (jobStatus === 'error') {
          clearInterval(interval)
          setStatus('error')
          setMessage(jobMessage)
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Price Scraper
          </h1>
          <p className="text-gray-600">
            Upload your OEM codes and get price comparisons from Australian toner retailers
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel File (OEM Codes)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                  disabled={status === 'uploading' || status === 'scraping'}
                />
                {file && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {file.name}
                  </p>
                )}
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={status === 'uploading' || status === 'scraping'}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Results will be sent to this email
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || !email || status === 'uploading' || status === 'scraping'}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold
                hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                flex items-center justify-center space-x-2 transition-all"
            >
              {status === 'uploading' || status === 'scraping' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{status === 'uploading' ? 'Uploading...' : 'Scraping...'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Start Scraping</span>
                </>
              )}
            </button>
          </form>

          {/* Status Messages */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              status === 'success' ? 'bg-green-50 border border-green-200' :
              status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start">
                {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />}
                {status === 'error' && <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />}
                {(status === 'uploading' || status === 'scraping') && (
                  <Loader2 className="w-5 h-5 text-blue-600 mr-2 mt-0.5 animate-spin" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    status === 'success' ? 'text-green-800' :
                    status === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {message}
                  </p>
                  {progress.total > 0 && status === 'scraping' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progress.current} / {progress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">How it works:</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Upload an Excel file with OEM codes (one per row)</li>
              <li>Enter your email address</li>
              <li>Click "Start Scraping" to begin</li>
              <li>The scraper will check InkStation and HotToner for prices</li>
              <li>Results will be emailed to you (takes 1-2 hours)</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Powered by Selenium & Next.js</p>
        </div>
      </div>
    </main>
  )
}
