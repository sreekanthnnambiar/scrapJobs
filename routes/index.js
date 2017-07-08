var express = require('express');
var router = express.Router();
var fs = require('fs'),
    app     = express();
var http = require('http');
var server = http.createServer(app);
var request=require('request');
var cheerio=require('cheerio');
var cassandra = require('cassandra-driver');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });

});

router.post('/', function(req, res, next) {	

  var job_title=req.body.title;


	var url3=findUrl(job_title);
	nextPage(url3);
  
});




var client = new cassandra.Client({contactPoints: ['127.0.0.1:9042'], keyspace: 'demo'});
	//var url1="https://www.indeed.com/jobs?q=data+analyst&l=United+States";//we can give our required url here
	var companies=[];
	var nextPageUrl;
	var count=1;


	

	function findUrl(jName){
		//var jobName="user acquisition";
		var wordSplit=jName.split(" ");
		var word1=wordSplit[0];
		var word2=wordSplit[1];
		if(word2)
		{
			return "https://www.indeed.com/jobs?q="+word1+"+"+word2+"&l=United+States"
		}
		else
		{
			return "https://www.indeed.com/jobs?q=+"+word1+"&l=United+States"	
		}
	}
	
	function createCompany(company){

		var id=cassandra.types.uuid();

		client.execute("insert into demo.company2(id,job_title,company_name,job_location,state,city)values(?,?,?,?,?,?)",[id,company.jobTitle,company.name,company.jobLocation,company.state,company.city], function (err, result) {
           if (!err){
               console.log("details added");
           }
		   else{
			   console.log("details not added");
		   }
		})


	}
	function findAllCompanies(body){
		var $=cheerio.load(body);
		console.log("Getting Comapnies");
		$('.result').each(function() { //result is the class used in each division containing the required data
			
			
			var company={};
			company.name= $(this).find('.company').text().trim();
			company.jobTitle= $(this).find('.jobtitle').text().trim();
			company.jobLocation=$(this).find('.location').text().trim();
			var locationName=company.jobLocation=$(this).find('.location').text().trim();
        	var locationSplit=locationName.split(',');
        	if(locationSplit[1])
        	{
        	 	var stateFull=locationSplit[1].split(' ');
         		if(stateFull[1])
         		{
           			var state=stateFull[1];
					company.state=state;
         		}
				if(locationSplit[0])
				{
					var city=locationSplit[0];
					company.city=city;
				}
			
        	}
			


			companies.push(company);// datas are entered to companies[]
			createCompany(company);
			console.log(company);// displays all company names and job titles 

			
			

		});
		nextPageUrl="https://www.indeed.com"+$('.pagination a:last-child').attr('href');
		console.log(nextPageUrl);
		
			nextPage(nextPageUrl);
		
		
		
		
	}
	function findByJobtitle(jobtitle){
		console.log("Searching companies wher job title "+jobtitle);
		
		var serachresult=companies.filter(function(company){ //companies with required job titles will be filtered and stored in search results
			return company.jobTitle.indexOf(jobtitle)>-1;
		});
	
		serachresult.forEach(function(company) {
			console.log(company.name);	//searchresult is iterated and company names will be displayed 
		});
	}

		function nextPage(url)
		{
			request(url,function(err,resp,body)
			{
		
			findAllCompanies(body);//function for displaying all companies and job titles and the body of website is passed here
			
				
			// setTimeout(function(){
			// findByJobtitle("data analyst")//function for displaying companies with required required job title, we can pass the job title here
			// },2000)
			
			})
		}
	


module.exports = router;
