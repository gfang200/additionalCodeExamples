import csv
import re

base = open("template", "r").read()
final = ""
def clean(number):
	return re.sub("[^0-9]", "", number)

def enterKeys(string):
	final = ""
	for letter in string:
		if letter == ",":
			letter = "comma"
		final += 'xdotool search --onlyvisible --class "Chrome" windowfocus key ' + letter + '\n' +'xdotool sleep .25'+'\n'
	return final

incentives = csv.DictReader(open("sample.csv","r"))
for each in incentives:
	#print each
	spendX = each['Spend']
	spendX = clean(spendX)
	getY = each['Match']
	getY = clean(getY)
	country = each['Country Code']	
	actual = each['Actual Countries']
	currency = each['Currency']
	count = each['Safety']
	totalSpend = each['Min Crit']

	condition = ""
	#condition += '\nxdotool search --onlyvisible --class "Chrome" windowfocus key ctrl+c'
	condition += '\nxdotool search --onlyvisible --class "Chrome" windowfocus key ctrl+c'
	condition += "\nfoo=$(xclip -out -selection clipboard)"

	condition += '\nif [ "$foo" = "$bar" ]'
	condition += '\nthen\n'
	condition += enterKeys(totalSpend)
	condition += '\nfi'
	condition += "\nbar=$(xclip -out -selection clipboard)"
	#condition += "\ntouch blank"
	#condition += '\nxclip -selection clipboard blank'


	#print enterKeys(getY)

	try:
		
		replace = base.replace('~CC1', country[0])
		replace = replace.replace('~countryExpansion', enterKeys(actual.replace(" ","")))
		replace = replace.replace('~CC2', country[1])
		replace = replace.replace('~DC1', currency[0])
		replace = replace.replace('~DC2', currency[1])
		replace = replace.replace('~DC3', currency[2])
		replace = replace.replace('~TS', enterKeys(totalSpend))
		replace = replace.replace('~NC', enterKeys(count))
		replace = replace.replace('~DoX', enterKeys(spendX))
		replace = replace.replace('~GetY', enterKeys(getY))
		replace = replace.replace('~Cond', condition)

		print replace
		final += replace
	except:
		pass

output = open('auto.sh', 'w')
output.write(final)
output.close()
output = open('auto.txt', 'w')
output.write(final)
output.close()
#print replace
