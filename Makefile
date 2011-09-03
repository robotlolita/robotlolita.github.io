all:
	cd source/media && compass compile
	emacsclient --eval "(org-publish-project \"blog\" t)"
