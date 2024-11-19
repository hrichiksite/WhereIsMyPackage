"use client"

import { useState, useEffect, useCallback } from "react"
import Image from 'next/image'
import { Loader2, ArrowRight, Clock, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const loadingQuotes = [
  "Searching for your package in the multiverse...",
  "Teaching pigeons to track packages...",
  "Consulting with the delivery ninjas...",
  "Asking the delivery gods for guidance...",
  "Bribing the GPS satellites...",
  "Checking under the couch cushions...",
  "Sending carrier pigeons for reconnaissance...",
  "Decoding the secret package language...",
  "Calculating quantum package trajectories...",
  "Summoning the package whisperer..."
]

const carriers = [
  { name: "4PX", logo: "/carrierlogos/4px.png", apiCode: "4px" }
]

interface Country {
  name: string;
  code: string;
}

interface TrackingData {
  currentStatus: string;
  currentStatusDescription: string;
  origin: Country;
  destination: Country;
  daysInTransit: number;
  transitEvents: {
    description: string;
    location: string;
    timestamp: number;
  }[];
}

function ShipmentOverview({ origin, destination, daysInTransit }: { 
  origin: Country; 
  destination: Country;
  daysInTransit: number;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Shipment Route</h2>
          <div className="flex items-center justify-center text-sm text-muted-foreground gap-2">
            <Clock className="h-4 w-4" />
            <span>{daysInTransit} days in transit</span>
          </div>
        </div>
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Origin country/region</div>
            <div className="flex flex-col items-center gap-3">
              <Image
                src={`https://flagcdn.com/${origin.code.toLowerCase()}.svg`}
                alt={`${origin.name} flag`}
                width={64}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="font-medium">{origin.name}</div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-16">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-200 -translate-y-1/2" />
              <ArrowRight className="relative z-10 w-6 h-6 mx-auto text-blue-500 bg-background rounded-full p-1" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Destination country/region</div>
            <div className="flex flex-col items-center gap-3">
              <Image
                src={`https://flagcdn.com/${destination.code.toLowerCase()}.svg`}
                alt={`${destination.name} flag`}
                width={64}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="font-medium">{destination.name}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Component() {
  const [isTracking, setIsTracking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [selectedCarrier, setSelectedCarrier] = useState(carriers[0].apiCode)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLoading) {
      interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % loadingQuotes.length)
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isLoading])



  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber && selectedCarrier) {
      //set query params
      window.history.replaceState({}, document.title, `${window.location.pathname}?trackingID=${trackingNumber}&carrier=${selectedCarrier}`)
      setIsLoading(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOSTNAME}/track/${trackingNumber}/${selectedCarrier}`)
        const data = await response.json()
        setTrackingData(data.data)
        setIsTracking(true)
      } catch (error) {
        console.error("Error fetching tracking data:", error)
        // Handle error (e.g., show error message to user)
      } finally {
        setIsLoading(false)
      }
    }
  }, [trackingNumber, selectedCarrier])

  const groupConsecutiveEvents = (events: TrackingData['transitEvents']) => {
    return events.reduce((acc, event, index) => {
      if (index === 0 || event.location !== events[index - 1].location || event.location === 'Unknown') {
        acc.push([event])
      } else {
        acc[acc.length - 1].push(event)
      }
      return acc
    }, [] as TrackingData['transitEvents'][])
  }

  //if query params are present, fetch tracking data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const trackingNumber = urlParams.get('trackingID')
    const carrier = urlParams.get('carrier')
    if (trackingNumber && carrier) {
      setTrackingNumber(trackingNumber)
      setSelectedCarrier(carrier)
      handleSubmit(new Event('submit') as unknown as React.FormEvent)
    }
  }, [handleSubmit])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delayed':
        return 'bg-amber-500'
      case 'exception':
        return 'bg-red-500'
      default:
        return 'bg-primary'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }
    return new Intl.DateTimeFormat('en-US', options).format(date)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground animate-fade-in">
            {loadingQuotes[quoteIndex]}
          </p>
        </div>
      </div>
    )
  }

  if (!isTracking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-3xl space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl font-sans">
              Where is my package
            </h1>
            <p className="mt-2 text-xl text-muted-foreground font-sans">(simple, elegant, demure)</p>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full gap-4">
            <Input
              placeholder="Enter your tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="flex-1 text-lg h-12 font-sans"
            />
            <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
              <SelectTrigger className="w-[180px] h-12 font-sans">
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((carrier) => (
                  <SelectItem key={carrier.apiCode} value={carrier.apiCode}>
                    <div className="flex items-center">
                      <Image src={carrier.logo} alt={carrier.name} width={40} height={40} className="w-5 h-5 mr-2" />
                      {carrier.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" size="lg" className="w-32 text-lg font-sans">
              Find it!
            </Button>
          </form>
        </div>
        <footer className="absolute bottom-4 text-center text-sm text-muted-foreground font-sans">
          Made during Hack Club&apos;s YSWS program - High Seas
        </footer>
      </div>
    )
  }

  const sortedEvents = trackingData?.transitEvents.slice().sort((a, b) => b.timestamp - a.timestamp) || []
  const groupedEvents = groupConsecutiveEvents(sortedEvents)

  return (
    <div className="min-h-screen font-sans">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsTracking(false)
                  setTrackingNumber("")
                  setTrackingData(null)
                  // Clear query params
                  window.history.replaceState({}, document.title, window.location.pathname)
                }}
              >
                ← Back
              </Button>
              <div className="flex gap-2">
                <Badge variant="secondary">#{trackingNumber}</Badge>
                <Badge className={getStatusColor(trackingData?.currentStatus || '')}>
                  {trackingData?.currentStatus}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-[350px,1fr]">
        <div className="border-r bg-background overflow-y-auto md:h-[calc(100vh-73px)]">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Transit Events</h2>
            <div className="space-y-4">
              {groupedEvents.map((group, groupIndex) => (
                <div key={groupIndex} className="bg-white rounded-lg shadow-md p-4">
                  {group[0].location !== 'Unknown' && (
                    <h3 className="font-medium text-lg mb-2">{group[0].location.replace(/,(?!\s)/g, ', ')}</h3>
                  )}
                  {group.map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="relative flex flex-col gap-4 py-2"
                    >
                      <div className="flex items-start gap-4">
                        {event.location === 'Unknown' ? (
                          <Info className="h-6 w-6 text-blue-500 mt-1" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground mt-1">
                            <span className="text-xs">
                              {sortedEvents.filter(e => e.location !== 'Unknown').length - sortedEvents.filter(e => e.location !== 'Unknown').findIndex(e => e === event)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{event.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatTimestamp(event.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="h-[calc(100vh-73px)] overflow-y-auto">
          {trackingData && (
            <ShipmentOverview 
              origin={trackingData.origin}
              destination={trackingData.destination}
              daysInTransit={trackingData.daysInTransit}
            />
          )}
        </div>
      </div>
    </div>
  )
}