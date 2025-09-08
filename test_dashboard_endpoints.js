// Test script to check all dashboard endpoints
// Run with: node test_dashboard_endpoints.js

const baseUrl = 'http://localhost:3000/api';
const headers = {
    'Content-Type': 'application/json',
    'x-user-id': '1',
    'x-user-role': 'admin'
};

async function testEndpoint(name, url, method = 'GET', body = null) {
    try {
        console.log(`\n🔍 Testing ${name}:`);
        console.log(`   URL: ${method} ${url}`);
        
        const options = {
            method,
            headers,
        };
        
        if (body) {
            options.body = JSON.stringify(body);
            console.log(`   Body: ${JSON.stringify(body, null, 2)}`);
        }
        
        const response = await fetch(url, options);
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`   ❌ Error: ${errorText}`);
            return { error: true, status: response.status, message: errorText };
        }
        
        const data = await response.json();
        console.log(`   ✅ Success! Data keys: [${Object.keys(data).join(', ')}]`);
        
        // Show sample data for arrays
        if (Array.isArray(data)) {
            console.log(`   📊 Array length: ${data.length}`);
            if (data.length > 0) {
                console.log(`   📋 First item: ${JSON.stringify(data[0], null, 2)}`);
            }
        } else if (data.bootcamps && Array.isArray(data.bootcamps)) {
            console.log(`   📊 Bootcamps array length: ${data.bootcamps.length}`);
            if (data.bootcamps.length > 0) {
                console.log(`   📋 First bootcamp: ${JSON.stringify(data.bootcamps[0], null, 2)}`);
            }
        } else if (data.instructors && Array.isArray(data.instructors)) {
            console.log(`   📊 Instructors array length: ${data.instructors.length}`);
            if (data.instructors.length > 0) {
                console.log(`   📋 First instructor: ${JSON.stringify(data.instructors[0], null, 2)}`);
            }
        } else {
            // Show sample of the data for other objects
            const keys = Object.keys(data);
            if (keys.length <= 5) {
                console.log(`   📋 Data: ${JSON.stringify(data, null, 2)}`);
            } else {
                console.log(`   📋 Sample keys: ${keys.slice(0, 5).join(', ')}...`);
            }
        }
        
        return { success: true, data };
    } catch (error) {
        console.log(`   💥 Exception: ${error.message}`);
        return { error: true, exception: error.message };
    }
}

async function runTests() {
    console.log('🚀 Testing ClassSight Dashboard Endpoints');
    console.log('=========================================');
    
    // Test health endpoint first
    await testEndpoint('Health Check', `${baseUrl}/health`);
    
    // Test filter data endpoints
    await testEndpoint('Bootcamps List', `${baseUrl}/bootcamps`);
    await testEndpoint('Instructors List', `${baseUrl}/instructors`);
    
    // Test dashboard endpoints with sample filter
    const sampleFilter = {
        bootcamp_ids: null, // No filter - get all data
        instructor_ids: null,
        granularity: "daily",
        include_completed: false
    };
    
    const dashboardEndpoints = [
        'kpis',
        'attendance-chart',
        'attention-chart',
        'student-metrics',
        'grade-performance',
        'instructor-performance',
        'correlation-analysis',
        'heatmap-data'
    ];
    
    for (const endpoint of dashboardEndpoints) {
        await testEndpoint(
            `Dashboard ${endpoint}`, 
            `${baseUrl}/dashboard/${endpoint}`, 
            'POST', 
            sampleFilter
        );
    }
    
    // Test with specific bootcamp filter
    console.log('\n🎯 Testing with Bootcamp Filter (ID: 1):');
    const bootcampFilter = {
        bootcamp_ids: [1], // Filter by bootcamp ID 1
        instructor_ids: null,
        granularity: "daily",
        include_completed: false
    };
    
    await testEndpoint(
        'KPIs with Bootcamp Filter', 
        `${baseUrl}/dashboard/kpis`, 
        'POST', 
        bootcampFilter
    );
    
    console.log('\n🏁 Test Complete!');
}

// Check if we're running in Node.js environment
if (typeof fetch === 'undefined') {
    console.log('❌ This script requires Node.js 18+ with fetch support, or run in browser console');
    console.log('💡 To run in browser: Copy the code and paste into browser console on localhost:3000');
} else {
    runTests().catch(console.error);
}
