"use client";
import { useState, useEffect } from "react";
import Loading from "../../../components/city/Loading";
import Buttons from "../../../components/city/Buttons";
import InfoBox from "../../../components/city/InfoBox";
import { Button, Heading, Box, Text, VStack, Image } from "@chakra-ui/react";
import Link from "next/link";

export default function CityDetails({ params }) {
    const id = params.cityId;
    const [cityData, setCityData] = useState({});
    const [weatherData, setWeatherData] = useState({});
    const [wikiSummary, setWikiSummary] = useState("");
    const [attractions, setAttractions] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [attractionsWithImages, setAttractionsWithImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
          try {
              const response = await fetch(`https://geocoding-api.open-meteo.com/v1/get?id=${id}`);
              if (!response.ok) {
                  console.error('Error fetching geocoding data');
                  return;
              }
              const data = await response.json();
              setCityData(data || {});
  
              const API_key = 'c9cf16cde00c379ccabe168a37cf9c5c';
              const lat = data.latitude;
              const lon = data.longitude;
  
              const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_key}&units=metric`);
              if (weatherResponse.ok) {
                  const data1 = await weatherResponse.json();
                  setWeatherData(data1 || {});
              }
  
              const cityName = data.name;
              if (cityName) {
                  const wikiResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`);
                  if (wikiResponse.ok) {
                      const wikiData = await wikiResponse.json();
                      setWikiSummary(wikiData.extract || "");
                  }
  
                  const attractionsResponse = await fetch(`https://en.wikivoyage.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(cityName)}&explaintext=1&exsectionformat=plain&origin=*`);
                  if (attractionsResponse.ok) {
                      const attractionsData = await attractionsResponse.json();
                      const pages = attractionsData.query.pages;
                      const page = pages[Object.keys(pages)[0]];
                      
                      if (page.extract) {
                          const extractSections = page.extract.split("\n");
  
                          let attractionsList = [];
                          let captureAttractions = false;
  
                          extractSections.forEach((section) => {
                              const lowerSection = section.toLowerCase();
  
                              if (lowerSection.includes("see") || lowerSection.includes("do") || lowerSection.includes("attractions") || lowerSection.includes("places to visit")) {
                                  captureAttractions = true;
                              } else if (lowerSection.includes("eat") || lowerSection.includes("drink") || lowerSection.includes("sleep")) {
                                  captureAttractions = false;
                              }
  
                              if (captureAttractions && section.trim().length > 0) {
                                  attractionsList.push(section);
                              }
                          });
  
                          const attractionsWithImagesList = await Promise.all(attractionsList.map(async (attraction) => {
                              const imageResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(attraction)}&prop=pageimages&format=json&piprop=thumbnail&origin=*`);
                              const imageData = await imageResponse.json();
  
                              const pages = imageData.query.pages;
                              const pageId = Object.keys(pages)[0];
                              const page = pages[pageId];
                              const imageUrl = page?.thumbnail?.source || null;
  
                              return { name: attraction, image: imageUrl };
                          }));
  
                          setAttractionsWithImages(attractionsWithImagesList);
                      }
                  }
  
                  const restaurantsResponse = await fetch(`https://en.wikivoyage.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(cityName)}&explaintext=1&exsectionformat=plain&origin=*`);
                  if (restaurantsResponse.ok) {
                      const restaurantsData = await restaurantsResponse.json();
                      const pages = restaurantsData.query.pages;
                      const page = pages[Object.keys(pages)[0]];
                      
                      if (page.extract) {
                          const extractSections = page.extract.split("\n");
  
                          let restaurantsList = [];
                          let captureRestaurants = false;
  
                          extractSections.forEach((section) => {
                              const lowerSection = section.toLowerCase();
  
                              if (lowerSection.includes("eat") || lowerSection.includes("restaurant") || lowerSection.includes("food")) {
                                  captureRestaurants = true;
                              } else if (lowerSection.includes("drink") || lowerSection.includes("sleep") || lowerSection.includes("stay")) {
                                  captureRestaurants = false;
                              }
  
                              if (captureRestaurants && section.trim().length > 0) {
                                  restaurantsList.push(section);
                              }
                          });
  
                          setRestaurants(restaurantsList);
                      }
                  }
              }
  
              setTimeout(() => {
                  setIsLoading(false);
              }, 500);
  
          } catch (error) {
              console.error('Error during data fetching:', error);
          }
      };
  
      fetchData();
  }, [id]);
  

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", backgroundColor: "#f3f4f6" }}>
            <Buttons cityData={cityData} />
            <InfoBox cityData={cityData} weatherData={weatherData} id={id} />
            
            <Box m={5} p={4} borderWidth="1px" borderRadius="lg" boxShadow="sm" style={{ backgroundColor: "#f9f9f9", marginBottom: "20px" }}>
                <Heading size="md" style={{ color: "#374151" }}>About {cityData.name}</Heading>
                <Text mt={2} style={{ color: "#555" }}>{wikiSummary || "No information available."}</Text>
            </Box>

            <Box m={5} p={4} borderWidth="1px" borderRadius="lg" boxShadow="sm" style={{ backgroundColor: "#e8f0fe", marginBottom: "20px" }}>
                <Heading size="md" style={{ color: "#1d4ed8" }}>Top Attractions</Heading>
                <VStack align="start" spacing={4}>
                    {attractionsWithImages.length > 0 ? attractionsWithImages.map((attraction, index) => (
                        <Box key={index} style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "10px",
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            width: "100%",
                            marginBottom: "10px",
                        }}>
                            {attraction.image ? (
                                <Image src={attraction.image} alt={attraction.name} boxSize="50px" borderRadius="full" marginRight="15px" />
                            ) : (
                                <Box boxSize="50px" borderRadius="full" backgroundColor="#ddd" marginRight="15px" />
                            )}
                            <Text style={{ fontSize: "15px", color: "#1f2937" }}>{attraction.name}</Text>
                        </Box>
                    )) : <Text style={{ color: "#1f2937" }}>No popular attractions available.</Text>}
                </VStack>
            </Box>

            <Box m={5} p={4} borderWidth="1px" borderRadius="lg" boxShadow="sm" style={{ backgroundColor: "#fef3c7", marginBottom: "20px" }}>
                <Heading size="md" style={{ color: "#b45309" }}>Top Restaurants</Heading>
                <VStack align="start" spacing={3} style={{ width: "100%" }}>
                    {restaurants.length > 0 ? restaurants.map((restaurant, index) => (
                        <Box key={index} style={{
                            padding: "10px",
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            borderWidth: "1px",
                            borderColor: "#e5e7eb",
                            width: "100%",
                        }}>
                            <Text style={{ fontSize: "15px", fontWeight: "500", color: "#92400e" }}>{restaurant}</Text>
                        </Box>
                    )) : <Text style={{ color: "#92400e" }}>No top restaurants available.</Text>}
                </VStack>
            </Box>

            <Button m={5} colorScheme="teal" variant="solid">
                <Link href="/">Go back to Home</Link>
            </Button>
        </div>
    );
}
