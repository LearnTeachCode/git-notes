# Web Dev Study Group Notes

May 10, 2017

At today's web dev study group, we'll also be testing out this early prototype for a GitHub-backed note-taking app! Thanks for your help!

## Group Notes:

<div class="notes">
	{% for note in site.notes %}	
		<h2>{{ note.username}}</h2>	
		<p>{{ note.content }}</p>	
	{% endfor %}
</div>