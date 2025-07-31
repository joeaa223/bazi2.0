import express from "express";
import { DateTime } from "luxon";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Country, State, City } from "country-state-city";
import { getBaziDetail } from "./sourcecode/index.js";
import { formatBaziData } from "./sourcecode/formatBaziData.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function configureBasicServer() {
  const app = express();

  // Middleware setup
  app.use(express.static(__dirname));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  return { app, __dirname };
}

export function setupLocationRoutes(app) {
  // Build country to timezones mapping
  const allCountries = Country.getAllCountries();
  const countryNames = Object.fromEntries(allCountries.map(c => [c.isoCode, c.name]));
  const countryToTimezones = {};
  allCountries.forEach(c => {
    if (c.timezones && c.timezones.length > 0) {
      countryToTimezones[c.isoCode] = c.timezones;
    }
  });
  app.locals.countryToTimezones = countryToTimezones;

  // Test route to ensure server is running
  app.get("/test", (req, res) => {
    res.json({ message: "Server is running!", timestamp: new Date().toISOString() });
  });

  // Serve the HTML form with all countries
  app.get("/", (req, res) => {
    try {
      const formPath = path.join(__dirname, 'form2.html');
      let formHtml = fs.readFileSync(formPath, 'utf8');
      
      // Inject country/timezone data
      const injectScript = `
        countryToTimezones = ${JSON.stringify(countryToTimezones)};
        countryNames = ${JSON.stringify(countryNames)};
        document.addEventListener('DOMContentLoaded', function() {
          // Populate country dropdown with priority countries on top
          const countrySelect = document.getElementById('country');
          countrySelect.innerHTML = '<option value="">请选择国家</option>';
          const priority = ['MY', 'SG', 'CN', 'TW', 'TH'];
          priority.forEach(code => {
            if (countryNames[code]) {
              const opt = document.createElement('option');
              opt.value = code;
              opt.textContent = countryNames[code];
              countrySelect.appendChild(opt);
            }
          });
          // Add the rest
          Object.entries(countryNames).forEach(([code, name]) => {
            if (!priority.includes(code)) {
              const opt = document.createElement('option');
              opt.value = code;
              opt.textContent = name;
              countrySelect.appendChild(opt);
            }
          });
        });
      `;
      formHtml = formHtml.replace('// This script will be replaced by the server to inject country/timezone data and populate the dropdowns', injectScript);
      res.send(formHtml);
    } catch (error) {
      console.error('Error serving form:', error);
      res.status(500).json({ error: 'Failed to load form', details: error.message });
    }
  });

  // Serve form.html with all countries
  app.get("/form", (req, res) => {
    const formPath = path.join(__dirname, 'form.html');
    let formHtml = fs.readFileSync(formPath, 'utf8');
    
    // Inject country/timezone data
    const injectScript = `
      countryToTimezones = ${JSON.stringify(countryToTimezones)};
      countryNames = ${JSON.stringify(countryNames)};
      document.addEventListener('DOMContentLoaded', function() {
        // Populate country dropdown with priority countries on top
        const countrySelect = document.getElementById('country');
        countrySelect.innerHTML = '<option value="">Select country</option>';
        const priority = ['MY', 'SG', 'CN', 'TW', 'TH'];
        priority.forEach(code => {
          if (countryNames[code]) {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = countryNames[code];
            countrySelect.appendChild(opt);
          }
        });
        // Add the rest
        Object.entries(countryNames).forEach(([code, name]) => {
          if (!priority.includes(code)) {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = name;
            countrySelect.appendChild(opt);
          }
        });
      });
    `;
    formHtml = formHtml.replace('// This script will be replaced by the server to inject country/timezone data and populate the dropdowns', injectScript);
    res.send(formHtml);
  });

  // Endpoint to get states for a country
  app.get("/states/:countryCode", (req, res) => {
    const states = State.getStatesOfCountry(req.params.countryCode);
    res.json(states);
  });

  // Endpoint to get cities for a state
  app.get("/cities/:countryCode/:stateCode", (req, res) => {
    const cities = City.getCitiesOfState(req.params.countryCode, req.params.stateCode);
    res.json(cities);
  });
}

export function setupConversionRoute(app) {
  // Handle form submission
  app.post("/convert", async (req, res) => {
    const { country, state, city, birthdate, time, gender } = req.body;
    
    // Basic validation
    if (!country || !state || !city || !birthdate || !time || (gender !== '0' && gender !== '1')) {
      return res.status(400).json({ error: "All fields are required, including gender." });
    }
    
    // Validate date and time format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate) || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ error: "Please enter a valid date (YYYY-MM-DD) and time (HH:MM)." });
    }

    let timezone = "UTC";
    try {
      // Get timezone from country
      const countryTzs = app.locals.countryToTimezones[country] || [];
      if (countryTzs.length > 0) {
        timezone = countryTzs[0].zoneName;
      }
      
      if (timezone === "UTC") {
        return res.status(400).json({ error: "Could not determine timezone for the selected location." });
      }
      
      const localDateTime = DateTime.fromISO(`${birthdate}T${time}:00`, { zone: timezone });
      if (!localDateTime.isValid) {
        return res.status(400).json({ error: "Invalid date or time format." });
      }
      
      const isoString = localDateTime.toUTC().toISO();
      
      // Get BaZi data
      const baziData = await getBaziDetail({ solarDatetime: isoString, gender: Number(gender), eightCharProviderSect: 1 });
      
      // Store in session if session middleware is available
      if (req.session) {
        req.session.baziData = baziData;
        req.session.baziIso = isoString;
      }
      
      res.json({
        timezone,
        isoString,
        gender: gender === '0' ? 'Female' : 'Male',
        baziData
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
  });
}

export function setupBaziDataRoute(app) {
  // Endpoint to get BaZi data from session
  app.get("/get-bazi", async (req, res) => {
    if (!req.session || !req.session.baziData) {
      return res.status(404).json({ error: "No BaZi data found. Please submit your birth info first." });
    }
    
    try {
      // Get the formatted data
      const formatted = await formatBaziData(req.session.baziData, req);
      
      res.json({
        baziData: req.session.baziData,
        processedBaziData: formatted.formattedData,
        formattedString: formatted.formattedString,
        isoString: req.session.baziIso,
      });
    } catch (error) {
      console.error("Error getting BaZi data:", error);
      res.status(500).json({ 
        error: "Error processing BaZi data",
        details: error.message
      });
    }
  });
}