// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

// Define the types for the response data
type Data = {
  message: string,
  pointsOfInterestPrompt: any,
  itinerary: any,
}

type Error = {
  message: string,
}

// Retrieve the GPT API key from environment variables
const GPT_KEY = process.env.GPT_API_KEY

// Set up the headers for the OpenAI API request
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${GPT_KEY}`
}

// API route handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>
) {
  // Default values for the itinerary request
  let days = 4, city = 'Rio'

  // Parse the request body to get user-provided values for days and city
  if (req.body) {
    let body = JSON.parse(req.body)
    days = body.days
    city = body.city
  }

  // Split the city name into parts to validate its length
  const parts = city.split(' ')

  // Check if the city name is too long and throw an error if necessary
  if (parts.length > 5) {
    throw new Error('please reduce size of request')
  }

  // Limit the number of days to a maximum of 10
  if (days > 10) {
    days = 10
  }

  // Construct the base prompt for generating the itinerary
  let basePrompt = `what is an ideal itinerary for ${days} days in ${city}?`

  try {
    // Make a request to the OpenAI API to generate the itinerary
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'text-davinci-003',
        prompt: basePrompt,
        temperature: 0, // Use 0 for deterministic responses
        max_tokens: 550 // Limit the number of tokens to control output length
      })
    })
    
    // Parse the response to get the generated itinerary
    const itinerary = await response.json()

    // Construct a new prompt to extract points of interest from the itinerary
    const pointsOfInterestPrompt = 'Extract the points of interest out of this text, with no additional words, separated by commas: ' + itinerary.choices[0].text

    // Send the successful response with the itinerary and points of interest prompt
    res.status(200).json({
      message: 'success',
      pointsOfInterestPrompt,
      itinerary: itinerary.choices[0].text
    })

  } catch (err) {
    // Log the error and return a 500 response if something goes wrong
    console.log('error: ', err)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
