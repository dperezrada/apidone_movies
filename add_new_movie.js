var request = require('request'),
	async = require('async'),
	util = require('util');

var make_request = function(url, callback){
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			callback(null, json);
		}else{
			callback('Error', null);
		}
	});
}

var prepare_url = function(url_format, movie_name, year){
	var escaped_name = encodeURIComponent(movie_name);
	if(year)
		return util.format(url_format, escaped_name, year);
	else
		return util.format(url_format, escaped_name);
}

var get_rotten_tomatoes = function(movie_name, year, callback){
	var url = prepare_url("http://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey=vys8u484er8ecdhtwjnms6fb&q=%s", movie_name);
	make_request(url, function(err, json){
		if(!err && json.movies.length> 0){
			for (var i=0; i < json.movies.length; i++) {
				var movie_year = parseInt(json.movies[i].year, 10);
				year = parseInt(year, 10)
				if( movie_year > year-3 && movie_year < year+3){
					callback(null, json.movies[i]);
					return;
				}
			};
		}
 		callback('Error', null);
	});
};

var get_imdb = function(movie_name, year, callback){
	var url = prepare_url("http://www.imdbapi.com/?t=%s&y=%s",movie_name, year);
	make_request(url, function(err, json){
		if(!err && json.Response == "True") callback(null, json);
		else callback('Error', null);
	});
};

var send_data_apidone = function(movie_data){
	request.post({url: 'http://movies.apidone.com/movies', json: movie_data}, function (e, r, body) {
		if(!e){
			console.log('Ok');
		}else{
			console.log('Error on create');
		}
	});
}

var merge_data = function(rotten, imdb){
	var movie_data = {
		'title': rotten.title || imdb.Title,
		'year': rotten.year || imdb.Year,
		'runtime': rotten.runtime,
		'critics_consensus': rotten.critics_consensus,
		'genre': []
	};
	movie_data['year'] = ""+movie_data['year']
	if(rotten && rotten.ratings){
		if(rotten.ratings.critics_score){
			movie_data.rating_rotten_critics = rotten.ratings.critics_score;
		}
		if(rotten.ratings.audience_score){
			movie_data.rating_rotten_audience = rotten.ratings.audience_score;
		}
		if(rotten.ratings.critics_score && rotten.ratings.audience_score){
			if(rotten.ratings.critics_score >=0 && rotten.ratings.audience_score >=0){
				movie_data.rating_rotten_average = (movie_data.rating_rotten_critics + movie_data.rating_rotten_audience)/2.0
			}
			else{
				movie_data.rating_rotten_average = Math.max(movie_data.rating_rotten_critics, movie_data.rating_rotten_audience);
			}
		}
		if(rotten.posters){
			if(rotten.posters.thumbnail){
				movie_data.image_thumb = rotten.posters.thumbnail;
			}
			if(rotten.posters.original){
				movie_data.image = rotten.posters.original;
			}
		}
	}
	if(imdb){
		if(imdb.imdbRating){
			movie_data.rating_imdb = imdb.imdbRating;
		}
		if(imdb.imdbVotes){
			movie_data.rating_imdb_votes = imdb.imdbVotes;
		}
		if(imdb.Poster){
			if(!movie_data.image_thumb){
				movie_data.image_thumb = imdb.Poster;
			}
			if(!movie_data.image){
				movie_data.image = imdb.Poster;
			}
		}
		if(imdb.Genre){
			var genre = imdb.Genre.replace(/\s*,\s*/g, ",").split(',')
			movie_data.genre = genre;
		}
		if(imdb.Director) movie_data.directors = imdb.Director.replace(/\s*,\s*/g, ",").split(',');
		if(imdb.Writer) movie_data.writers = imdb.Writer.replace(/\s*,\s*/g, ",").split(',');
		if(imdb.Actors) movie_data.actors = imdb.Actors.replace(/\s*,\s*/g, ",").split(',');
	}
	return movie_data;
}

if (!module.parent) {
	var movie = process.argv[2];
	var year = process.argv[3];
	async.series(
		[
	    	async.apply(get_rotten_tomatoes, movie, year),
	    	async.apply(get_imdb, movie, year)
		],
		function(err, results){
			if(!err && results.length == 2){
				var movie_data = merge_data(results[0], results[1]);
				send_data_apidone(movie_data);
				console.log(movie_data);
			}
			else{
				console.log("Not found");
				console.log(results)
			}
		}
	);
} else {
  // we were require()d from somewhere else
}
