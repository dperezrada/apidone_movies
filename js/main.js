// Setup

var App = {
	Models: {},
	Collections: {},
	Views: {},
	Instances: {},
	Variables: {},
}

// Models

App.Models.Movie = Backbone.Model.extend({});
App.Models.Genre = Backbone.Model.extend({});

// Variables
App.Variables.movies_url = 'http://localhost:3000/movies?_sort_by=rating_rotten_average&_sort_type=desc'
App.Variables.genre_url = 'http://localhost:3000/movies?_select_distinct=genre'

// Collections

App.Collections.Movies = Backbone.Collection.extend({
	model: App.Models.Movie
});
App.Collections.Genres = Backbone.Collection.extend({
	model: App.Models.Genre,
	comparator: function(genre) {
  		return genre.get("genre");
	}
});

// Views
App.Views.MoviesList = Backbone.View.extend({
	el: '.movies-list',
	initialize: function(){
		$(this.el).html("");
		this.collection = new App.Collections.Movies();
		this.collection.bind('reset', this.render, this);
		this.collection.bind('add', this.render, this);
		this.collection.fetch({url: App.Variables.movies_url});
	},
	render: function(){
		$(this.el).html("");
		this.collection.each(function(model){
			this.addOne(model);
		}, this);
	},
	addOne: function(model) {
		var view = new App.Views.MovieListed({model: model});
		$(this.el).append(view.render().el);
	},
});

App.Views.MovieListed = Backbone.View.extend({
	tagName: 'li',
	className: 'movie-listed',
	template: _.template($('#tpl-movie-listed').html()),
	events: {
		"click": "selectClient"
	},
	render: function(){
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	},
	selectClient: function(e){
		var target = e.target;
		if (target.tagName!="LI") {
			target = $(target).parent();
		}
		$('.movie-listed').removeClass('selected');
		$(target).addClass('selected');
		new App.Views.MovieDetail({model: this.model});
	}
});

App.Views.MovieDetail = Backbone.View.extend({
	tag: 'div',
	template: _.template($('#tpl-movie-detail').html()),
	initialize: function(){
		this.render();
	},
	render: function(){
		$(this.el).html(this.template(this.model.toJSON()));
		$('#movies-container .main').html(this.el);
	}
});

App.Views.GenresList = Backbone.View.extend({
	tagName: 'select',
	className: 'genre_select',
	events: {
		'change': 'changeGenre'
	},
	initialize: function(){
		$(this.el).html("");
		this.collection = new App.Collections.Genres();
		this.collection.bind('reset', this.render, this);
		this.collection.bind('add', this.render, this);
		this.collection.fetch({url: App.Variables.genre_url});
	},
	render: function(){
		$(this.el).append("<option value='All'>All Genres</option>");
		this.collection.each(function(model){
			this.addOne(model);
		}, this);
		$('.genres-list').html(this.el);
	},
	addOne: function(model) {
		var view = new App.Views.GenreListed({model: model});
		$(this.el).append(view.render().el);
	},
	changeGenre: function(e){
		var genre = $(e.target).val();
		App.Variables.movies_url = 'http://localhost:3000/movies?_sort_by=rating_rotten_average&_sort_type=desc'
		if(genre != "All"){
			App.Variables.movies_url+='&genre='+genre;
		}
		App.Instances.Views.movie_list.collection.fetch({url: App.Variables.movies_url});
	}
});

App.Views.GenreListed = Backbone.View.extend({
	tagName: 'option',
	render: function(){
		$(this.el).attr('value', this.model.get('genre'));
		$(this.el).text(this.model.get('genre'));
		return this;
	}
});

App.Instances.Views = {'movie_list': new App.Views.MoviesList()};
App.Instances.Views['genre_list'] = new App.Views.GenresList();