// Supabase Configuration
const SUPABASE_URL = 'https://quvpwoyomabhjvushkqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dnB3b3lvbWFiaGp2dXNoa3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDEzMDgsImV4cCI6MjA2OTc3NzMwOH0.7hYImCfK-2O4yG_-1P2wZLjTXiQ4nFWYERPPy7JBYIo';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication functions
async function signUp(email, password, fullName) {
    try {
        // Step 1: Sign up the user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (authError) throw authError;

        // Step 2: Create profile in profiles table
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    { 
                        id: authData.user.id, 
                        full_name: fullName,
                        email: email,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (profileError) {
                console.error('Error creating profile:', profileError.message);
                // Don't throw error here, as auth user is already created
            }
        }

        return { success: true, data: authData };
    } catch (error) {
        console.error('SignUp error:', error);
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    try {
        console.log('Attempting sign in with:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('SignIn error:', error);
            throw error;
        }
        
        console.log('Sign in successful:', data);
        return { success: true, data };
    } catch (error) {
        console.error('SignIn catch error:', error);
        return { success: false, error: error.message };
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state change:', event, session);
    // Note: currentUser and updateAuthUI are handled in fin.js
    // This listener is kept for logging purposes
});

// Database functions for donations
async function saveClothingDonation(donationData) {
    try {
        // Get current user from Supabase auth session
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('clothing_donations')
            .insert([{
                user_id: user?.id,
                full_name: donationData.fullName,
                email: donationData.email,
                phone: donationData.phone,
                clothing_type: donationData.clothingType,
                quantity: donationData.quantity,
                description: donationData.description,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Check for matches with receiver requests
        await checkForMatches('clothing', donationData);
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function saveFoodDonation(donationData) {
    try {
        // Get current user from Supabase auth session
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('food_donations')
            .insert([{
                user_id: user?.id,
                full_name: donationData.fullName,
                email: donationData.email,
                phone: donationData.phone,
                food_type: donationData.foodType,
                quantity: donationData.quantity,
                description: donationData.description,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Check for matches with receiver requests
        await checkForMatches('food', donationData);
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function saveEducationDonation(donationData) {
    try {
        // Get current user from Supabase auth session
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('education_donations')
            .insert([{
                user_id: user?.id,
                full_name: donationData.fullName,
                email: donationData.email,
                phone: donationData.phone,
                book_type: donationData.bookType,
                quantity: donationData.quantity,
                description: donationData.description,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Check for matches with receiver requests
        await checkForMatches('education', donationData);
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function saveMoneyDonation(donationData) {
    try {
        // Get current user from Supabase auth session
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('money_donations')
            .insert([{
                user_id: user?.id,
                full_name: donationData.fullName,
                email: donationData.email,
                phone: donationData.phone,
                amount: donationData.amount,
                payment_method: donationData.paymentMethod,
                message: donationData.message,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Check for matches with receiver requests
        await checkForMatches('money', donationData);
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Save receiver data
async function saveReceiverData(receiverData) {
    try {
        const { data, error } = await supabase
            .from('receivers')
            .insert([{
                full_name: receiverData.fullName,
                email: receiverData.email,
                phone: receiverData.phone,
                address: receiverData.address,
                needs: receiverData.needs,
                family_size: receiverData.familySize,
                description: receiverData.description,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Check for matches with existing donations
        await checkForMatches('receiver', receiverData);
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Check for matches between donations and receiver requests
async function checkForMatches(type, data) {
    try {
        console.log('🔍 Checking for matches...');
        console.log('Type:', type);
        console.log('Data:', data);
        
        let matches = [];
        
        if (type === 'clothing' || type === 'food' || type === 'education' || type === 'money') {
            // New donation - check against receiver requests
            console.log('Looking for receivers with needs:', type);
            const { data: receivers } = await supabase
                .from('receivers')
                .select('*')
                .eq('needs', type);
            
            console.log('Found receivers:', receivers);
            
            if (receivers && receivers.length > 0) {
                // Only create matches when there's a name match
                const nameMatches = receivers.filter(receiver => 
                    receiver.full_name.toLowerCase() === data.fullName.toLowerCase()
                );
                
                matches = nameMatches.map(receiver => ({
                    type: 'donation_to_receiver',
                    donation: data,
                    receiver: receiver,
                    message: `🎉 NAME MATCH FOUND! ${data.fullName} donated ${type} that matches ${receiver.full_name}'s request. Contact: ${receiver.email}`
                }));
                console.log('Created name matches:', matches);
            }
            
            // Enhanced keyword matching for food donations (only with name match)
            if (type === 'food') {
                const { data: allReceivers } = await supabase
                    .from('receivers')
                    .select('*');
                
                if (allReceivers && allReceivers.length > 0) {
                    const keywordMatches = findKeywordMatches(data, allReceivers);
                    // Filter keyword matches to only include name matches
                    const nameMatchedKeywordMatches = keywordMatches.filter(match => 
                        match.receiver.full_name.toLowerCase() === data.fullName.toLowerCase()
                    );
                    matches = matches.concat(nameMatchedKeywordMatches);
                }
            }
        } else if (type === 'receiver') {
            // New receiver request - check against existing donations
            const { data: donations } = await supabase
                .from(`${data.needs}_donations`)
                .select('*');
            
            if (donations && donations.length > 0) {
                // Only create matches when there's a name match
                const nameMatches = donations.filter(donation => 
                    donation.full_name.toLowerCase() === data.fullName.toLowerCase()
                );
                
                matches = nameMatches.map(donation => ({
                    type: 'receiver_to_donation',
                    donation: donation,
                    receiver: data,
                    message: `🎉 NAME MATCH FOUND! ${data.fullName} needs ${data.needs} and ${donation.full_name} has donated ${data.needs}. Contact: ${donation.email}`
                }));
            }
            
            // Enhanced keyword matching for food requests (only with name match)
            if (data.needs === 'food') {
                const { data: allDonations } = await supabase
                    .from('food_donations')
                    .select('*');
                
                if (allDonations && allDonations.length > 0) {
                    const keywordMatches = findKeywordMatchesForReceiver(data, allDonations);
                    // Filter keyword matches to only include name matches
                    const nameMatchedKeywordMatches = keywordMatches.filter(match => 
                        match.donation.full_name.toLowerCase() === data.fullName.toLowerCase()
                    );
                    matches = matches.concat(nameMatchedKeywordMatches);
                }
            }
        }
        
        // Send notifications for matches
        if (matches.length > 0) {
            console.log('🎉 Found', matches.length, 'matches! Sending notifications...');
            await sendMatchNotifications(matches);
        } else {
            console.log('❌ No matches found');
        }
        
        return matches;
    } catch (error) {
        console.error('Error checking for matches:', error);
        return [];
    }
}

// Find keyword matches for food donations
function findKeywordMatches(donation, receivers) {
    const matches = [];
    const donationText = `${donation.foodType} ${donation.description || ''}`.toLowerCase();
    
    const foodKeywords = [
        'rice', 'milk', 'bread', 'vegetables', 'fruits', 'meat', 'chicken', 'fish',
        'eggs', 'cheese', 'butter', 'oil', 'sugar', 'salt', 'flour', 'pasta',
        'beans', 'lentils', 'potatoes', 'onions', 'tomatoes', 'carrots', 'apples',
        'bananas', 'oranges', 'milk', 'yogurt', 'cereal', 'snacks', 'juice'
    ];
    
    receivers.forEach(receiver => {
        if (receiver.needs === 'food' && receiver.description) {
            const receiverText = receiver.description.toLowerCase();
            
            // Check for keyword matches AND name match
            const matchedKeywords = foodKeywords.filter(keyword => 
                donationText.includes(keyword) && receiverText.includes(keyword)
            );
            
            const nameMatch = receiver.full_name.toLowerCase() === donation.fullName.toLowerCase();
            
            if (matchedKeywords.length > 0 && nameMatch) {
                matches.push({
                    type: 'keyword_match',
                    donation: donation,
                    receiver: receiver,
                    keywords: matchedKeywords,
                    message: `🔍 KEYWORD & NAME MATCH! ${donation.fullName} donated food containing "${matchedKeywords.join(', ')}" that matches ${receiver.full_name}'s request. Contact: ${receiver.email}`
                });
            }
        }
    });
    
    return matches;
}

// Find keyword matches for food receiver requests
function findKeywordMatchesForReceiver(receiver, donations) {
    const matches = [];
    const receiverText = `${receiver.description || ''}`.toLowerCase();
    
    const foodKeywords = [
        'rice', 'milk', 'bread', 'vegetables', 'fruits', 'meat', 'chicken', 'fish',
        'eggs', 'cheese', 'butter', 'oil', 'sugar', 'salt', 'flour', 'pasta',
        'beans', 'lentils', 'potatoes', 'onions', 'tomatoes', 'carrots', 'apples',
        'bananas', 'oranges', 'milk', 'yogurt', 'cereal', 'snacks', 'juice'
    ];
    
    donations.forEach(donation => {
        const donationText = `${donation.food_type} ${donation.description || ''}`.toLowerCase();
        
        // Check for keyword matches AND name match
        const matchedKeywords = foodKeywords.filter(keyword => 
            donationText.includes(keyword) && receiverText.includes(keyword)
        );
        
        const nameMatch = receiver.full_name.toLowerCase() === donation.full_name.toLowerCase();
        
        if (matchedKeywords.length > 0 && nameMatch) {
            matches.push({
                type: 'keyword_match',
                donation: donation,
                receiver: receiver,
                keywords: matchedKeywords,
                message: `🔍 KEYWORD & NAME MATCH! ${receiver.full_name} needs food containing "${matchedKeywords.join(', ')}" and ${donation.full_name} has donated similar items. Contact: ${donation.email}`
            });
        }
    });
    
    return matches;
}

// Send match notifications
async function sendMatchNotifications(matches) {
    try {
        console.log('📧 Sending match notifications for', matches.length, 'matches');
        
        // Show notification to user
        matches.forEach(match => {
            showMatchNotification(match.message);
        });
        
        // Send email notification to admin
        await sendMatchEmailToAdmin(matches);
        
        return { success: true };
    } catch (error) {
        console.error('Error sending notifications:', error);
        return { success: false, error: error.message };
    }
}

// Send match notification email to admin
async function sendMatchEmailToAdmin(matches) {
    try {
        console.log('Sending match notifications for', matches.length, 'matches');
        
        // Prepare detailed email content
        let emailContent = '🎉 MATCH NOTIFICATIONS - Care Bridge\n\n';
        emailContent += 'The following matches were found between donations and requests:\n\n';
        
        matches.forEach((match, index) => {
            emailContent += `=== MATCH ${index + 1} ===\n`;
            emailContent += `Type: ${match.type}\n`;
            emailContent += `Message: ${match.message}\n`;
            
            // Add keyword information for keyword matches
            if (match.type === 'keyword_match' && match.keywords) {
                emailContent += `🔍 Matched Keywords: ${match.keywords.join(', ')}\n`;
            }
            emailContent += '\n';
            
            // Donor Details
            if (match.donation) {
                emailContent += '📤 DONOR DETAILS:\n';
                emailContent += `   Name: ${match.donation.full_name}\n`;
                emailContent += `   Email: ${match.donation.email}\n`;
                emailContent += `   Phone: ${match.donation.phone || 'Not provided'}\n`;
                
                if (match.donation.clothing_type) {
                    emailContent += `   Item Type: ${match.donation.clothing_type}\n`;
                    emailContent += `   Quantity: ${match.donation.quantity}\n`;
                } else if (match.donation.food_type) {
                    emailContent += `   Food Type: ${match.donation.food_type}\n`;
                    emailContent += `   Quantity: ${match.donation.quantity}\n`;
                } else if (match.donation.book_type) {
                    emailContent += `   Book Type: ${match.donation.book_type}\n`;
                    emailContent += `   Quantity: ${match.donation.quantity}\n`;
                } else if (match.donation.amount) {
                    emailContent += `   Amount: $${match.donation.amount}\n`;
                    emailContent += `   Payment Method: ${match.donation.payment_method}\n`;
                }
                
                if (match.donation.description) {
                    emailContent += `   Description: ${match.donation.description}\n`;
                }
                emailContent += '\n';
            }
            
            // Receiver Details
            if (match.receiver) {
                emailContent += '📥 RECEIVER DETAILS:\n';
                emailContent += `   Name: ${match.receiver.full_name}\n`;
                emailContent += `   Email: ${match.receiver.email}\n`;
                emailContent += `   Phone: ${match.receiver.phone || 'Not provided'}\n`;
                emailContent += `   Address: ${match.receiver.address}\n`;
                emailContent += `   Family Size: ${match.receiver.family_size}\n`;
                emailContent += `   Needs: ${match.receiver.needs}\n`;
                
                if (match.receiver.description) {
                    emailContent += `   Description: ${match.receiver.description}\n`;
                }
                emailContent += '\n';
            }
            
            emailContent += '='.repeat(60) + '\n\n';
        });
        
        console.log('Email content prepared:', emailContent);
        
        // Try multiple email methods
        let emailSent = false;
        
        // Method 1: Try EmailJS if available
        if (typeof emailjs !== 'undefined') {
            try {
                console.log('Attempting EmailJS...');
                await emailjs.send('service_jiyy8cq', 'template_474c67v', {
                    to_name: 'Siddi',
                    from_name: 'Care Bridge System',
                    from_email: 'system@carebridge.org',
                    message: emailContent,
                    reply_to: 'siddikoushik321@gmail.com'
                });
                console.log('✅ EmailJS email sent successfully');
                emailSent = true;
            } catch (emailError) {
                console.error('❌ EmailJS failed:', emailError);
            }
        }
        
        // Method 2: Try Formspree as fallback
        if (!emailSent) {
            try {
                console.log('Attempting Formspree...');
                const formspreeData = new FormData();
                formspreeData.append('name', 'Care Bridge System');
                formspreeData.append('email', 'system@carebridge.org');
                formspreeData.append('message', emailContent);
                
                const response = await fetch('https://formspree.io/f/xayzqjqp', {
                    method: 'POST',
                    body: formspreeData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log('✅ Formspree email sent successfully');
                    emailSent = true;
                } else {
                    console.error('❌ Formspree failed:', response.status);
                }
            } catch (formspreeError) {
                console.error('❌ Formspree error:', formspreeError);
            }
        }
        
        // Method 3: Log to console for manual sending
        if (!emailSent) {
            console.log('📧 MANUAL EMAIL CONTENT (copy and send manually):');
            console.log('Subject: 🎉 MATCH NOTIFICATIONS - Care Bridge');
            console.log('To: siddikoushik321@gmail.com');
            console.log('Content:');
            console.log(emailContent);
        }
        
        return { success: emailSent };
    } catch (error) {
        console.error('❌ Error in sendMatchEmailToAdmin:', error);
        return { success: false, error: error.message };
    }
}

// Test function to manually check for matches
async function testMatchDetection() {
    console.log('🧪 Testing match detection...');
    
    // Test with existing data
    const testDonation = {
        fullName: 'Test Donor',
        email: 'test@example.com',
        phone: '1234567890',
        clothingType: 'shirts',
        quantity: 5,
        description: 'wool cloth'
    };
    
    const matches = await checkForMatches('clothing', testDonation);
    console.log('Test results:', matches);
}

// Show match notification to user
function showMatchNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'match-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.5s ease;
        ">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <i class="fas fa-heart" style="font-size: 20px; color: #ff6b6b;"></i>
                <strong>Match Found!</strong>
            </div>
            <p style="margin: 0; line-height: 1.4;">${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
                font-size: 12px;
            ">Dismiss</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Get statistics from database
async function getStatistics() {
    try {
        // Get total donations
        const { data: clothingCount } = await supabase
            .from('clothing_donations')
            .select('id', { count: 'exact' });
        
        const { data: foodCount } = await supabase
            .from('food_donations')
            .select('id', { count: 'exact' });
        
        const { data: educationCount } = await supabase
            .from('education_donations')
            .select('id', { count: 'exact' });
        
        const { data: moneyCount } = await supabase
            .from('money_donations')
            .select('id', { count: 'exact' });
        
        // Get total receivers
        const { data: receiverCount } = await supabase
            .from('receivers')
            .select('id', { count: 'exact' });
        
        // Get unique cities (from receivers)
        const { data: cities } = await supabase
            .from('receivers')
            .select('address');
        
        const uniqueCities = new Set();
        if (cities) {
            cities.forEach(city => {
                if (city.address) {
                    const cityName = city.address.split(',')[0].trim();
                    uniqueCities.add(cityName);
                }
            });
        }
        
        return {
            totalDonations: (clothingCount?.length || 0) + (foodCount?.length || 0) + 
                           (educationCount?.length || 0) + (moneyCount?.length || 0),
            totalReceivers: receiverCount?.length || 0,
            totalCities: uniqueCities.size || 0
        };
    } catch (error) {
        console.error('Error getting statistics:', error);
        return {
            totalDonations: 0,
            totalReceivers: 0,
            totalCities: 0
        };
    }
}

// Get user's donation history
async function getUserDonations(userId) {
    try {
        const { data, error } = await supabase
            .from('all_donations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
} 