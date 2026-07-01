// Wait for the page to load before running JavaScript
document.addEventListener('DOMContentLoaded', function() {  // Listen for when HTML is fully loaded
    
    // Find HTML elements using their IDs
    const button = document.getElementById('demoButton');      // Get the button element by its ID
    const messageArea = document.getElementById('messageDisplay');  // Get the message area element by its ID
    
    // Add click event listener to the button
    button.addEventListener('click', function() {              // Listen for clicks on the button
        // Get current time and create a message
        const currentTime = new Date().toLocaleTimeString();   // Get current time as a string
        const message = 'Hello! You clicked the button at ' + currentTime;  // Create message with time
        
        // Display the message in our HTML
        messageArea.textContent = message;                     // Put the message in the HTML element
        
        // Change button text temporarily
        button.textContent = 'Thanks for clicking!';           // Change what the button says
    });
});