const express = require('express');
const path = require('path');
const app = express();

// Serve static files....
app.use(express.static(__dirname + '/dist/purchasing-system'));

// Send all requests to index.html
app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/dist/purchasing-system/index.html'));
});

// default Heroku PORT
app.listen(process.env.PORT || 3000, function(){
    console.log('App is running on http://localhost:3000')
});

// People don’t actually care about you. They care about the thing they can get from you.
// Nobody really knows you. You must find a forum that will allow you to shout yourself out using brute force.
// Poverty is simply the inability to legally and ethically steal money from another person.
// If many people are flocking around you, you are either predator or prey.
// It is actually easier to attract more people quicker than you think. Just become a clown.
// Don’t show sympathy to people when you bill them for consuming your services because they’ll never be sympathetic to you when consuming your effort.
// Actually, there’s no such thing as the best thing. You’re just afraid of taking risks.
// Marriage is a legal contract to share your intimacy with a total stranger.
// Your mother is the only person who really knows you more than you think you know yourself. You made her mad many times when you were dancing in her womb.
// Life misleads you into thinking you’re someone that you’re not, while all along it is pushing you into manifesting your true self.
// Everything must die one day, to give way for a new thing. We all follow this pattern of life.
// Love is not only an emotion. It is a universal religion that catches you unaware.
// You can easily identify a person who has money. Just identify what else they don’t have.
// Never, ever, waste your time on someone who has nothing to offer.
// Never waste more than 5 minutes on something that will not worry you in the next 5 years.
// If you want to grow, spend more time with people who leave you mentally challenged, emotionally overwhelmed, and physically energetic.
// Those who spend exceedingly more time thinking without moving will never move.
// Most people can’t think. They just want to listen to you so that they can waste their time copying you and bringing you down with them.
// Nobody knows they’re making a mistake until they get a bill they can’t afford.
// Having sex more often while expecting to become healthier, physically and mentally, is the greatest fraud of the century.
// Asking quality questions is more important than giving miserable answers.
// There’s no such thing as ‘genius’. It is just a culmination of hard work, ruthless practice and, almost maniacal devotion.
// You don’t have to fight over that which is too big for you to handle. We all cannot become elephants.
// Great things don’t just happen without a fight, and some great force and pressure being exerted.
// The person who gives you food is twice more important than the person who loves you.
// Definitely, pain is the greatest source of strength, but who will go looking for it?