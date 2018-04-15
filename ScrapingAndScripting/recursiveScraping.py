import xml.etree.ElementTree as ET
import os

##tree = ET.parse('aimshoem_project2.xml')
##tree = ET.parse('akbelviy_project2.xml')
##tree = ET.parse('kensulli_project2.xml')

trees = [ET.parse(tree) for tree in os.listdir(os.getcwd()) if ".xml" in tree]
##root = tree.getroot()
##
##node =  root[2]

def recursiveSearch(node, search, path=""):
    def buildPath(path, node, value="t"):
        if value == "t":
            return path + "/" + node.tag
        else:
            return path + "/"+node.tag+ "/@" + value
    def findAttribute(node, search):
        for attribute, value in node.attrib.iteritems():
            if value == search:
                return attribute
    

    if node.text is not None and search.lower() in node.text.lower():
        return buildPath(path, node)[1:]
    if search in node.attrib.values():
        return buildPath(path, node, findAttribute(node, search))[1:]
 
    res = None
    
    for child in node:
        res = recursiveSearch(child, search, buildPath(path, node))
        if res!=None:
            return res

def extractPath(n, path):
    try:
        np=path.split("/")
        if n>=0:
            for i in range(n):
                np.pop()
            return "/".join(np)
        else:
            for i in range(n*-1):
                np.pop(0)
            return "/".join(np)
    except:
        return "error"
        

for tree in trees:
    root = tree.getroot()
    print recursiveSearch(root, "Grammy")
    print recursiveSearch(root, "Sam Smith")
    print recursiveSearch(root, "Rock")
    print recursiveSearch(root, "xw")
    print recursiveSearch(root, "Pretty Hurts")
    print recursiveSearch(root, ".jp")
    print recursiveSearch(root, "Capitol Records")
    print "-"*50
counter = 0
for tree in trees:
    root = tree.getroot()
    artistName = recursiveSearch(root, "artistNameCode")
    rootPath = extractPath(1, artistName)
    artistType = recursiveSearch(root, "artistTypeCode")
    careerDate = recursiveSearch(root, "careerDateCode")
    albumSKU = recursiveSearch(root, "albumSKUCode")
    albumType = recursiveSearch(root, "albumTypeCode")
    albumName = recursiveSearch(root, "albumNameCode")
    albumCategory = recursiveSearch(root, "albumCategoryCode")
    comment = recursiveSearch(root, "albumCommentCode")
    albumRating = recursiveSearch(root, "albumRatingCode")
    artistGenre = recursiveSearch(root, "albumGenreCode")
    trackSKU = recursiveSearch(root, "trackSKUCode")
    trackType = recursiveSearch(root, "trackTypeCode")
    trackPosition = recursiveSearch(root, "trackPositionCode")
##    albumSKU = recursiveSearch(root, "albumTitleCode")
    trackTitle = recursiveSearch(root, "songTitleCode")
    trackTime = recursiveSearch(root, "songTimeCode")
    trackComposer = recursiveSearch(root, "songComposerCode")
    print recursiveSearch(root, "releaseNameCode")
    releaseFormat = recursiveSearch(root, "releaseFormatCode")
    releaseDate = recursiveSearch(root, "releaseDateCode")
    releaseCountry = recursiveSearch(root, "releaseCountryCode")
    releaseLabel = recursiveSearch(root, "releaseLabelCode")
    releaseCatalog = recursiveSearch(root, "releaseCatalogNumberCode")
    releaseBar = recursiveSearch(root, "releaseBarCodeCode")
    picPath = recursiveSearch(root, "coverImageCode")
    picSRC = recursiveSearch(root, "pictureSourceCode")
    print recursiveSearch(root, "producerCode")
    print recursiveSearch(root, "mixerCode")
    print recursiveSearch(root, "engineerCode")
    print recursiveSearch(root, "recordlabelCode")
    
    print "-"*50

    xsl = """<?xml version="1.0"?>

    <!-- File Name: OrderTransform.xsl -->

    <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
         <xsl:output method="xml" indent="yes"/>	
         
    <xsl:template match="/">
         <music xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="gfang_project2-1.xsd">
            <xsl:for-each select="{0}">  
              <artist>
                   <artistInformation>
                        <artistName>
                             <xsl:value-of select="{1}"/>
                        </artistName>
                        <groupMembers>
                             <xsl:attribute name="groupType">
                                  <xsl:value-of select="{2}"/>
                             </xsl:attribute>
                        </groupMembers>
                        <origin>
                             <xsl:value-of select="{3}"/>
                        </origin>
                        <career>
                             <xsl:value-of select="{4}"/>
                        </career>
                        <genre>
                             <xsl:value-of select="{5}"/>
                        </genre>
                   </artistInformation>
              
                 <albums>
                      <album>
                           <xsl:attribute name="category">
                                <xsl:value-of select="{6}"/>
                           </xsl:attribute>
                           <xsl:attribute name="name">
                                <xsl:value-of select="{7}"/>
                           </xsl:attribute>
                           <xsl:attribute name="rating">
                                <xsl:value-of select="{8}"/>
                           </xsl:attribute>
                           <xsl:attribute name="sku">
                                <xsl:value-of select="{9}"/>
                           </xsl:attribute>
                           <xsl:attribute name="type">
                                <xsl:value-of select="{10}"/>
                           </xsl:attribute>
                            <songs>
                            <xsl:for-each select="{11}">
                            <song>
                                <xsl:attribute name="albumref">
                                    <xsl:value-of select="{12}"/>
                                </xsl:attribute>
                                <xsl:attribute name="sku">
                                    <xsl:value-of select="{13}"/>
                                </xsl:attribute>
                                <xsl:attribute name="type">
                                    <xsl:value-of select="{14}"/>
                                </xsl:attribute>
                                <position>
                                    <xsl:value-of select="{15}"/>
                                </position>
                                <title>
                                    <xsl:value-of select="{16}"/>
                                </title>
                                <composers>
                                    <composer>
                                        <xsl:value-of select="{17}"/>
                                    </composer>
                                </composers>
                                <length>
                                    <xsl:value-of select="{18}"/>
                                </length>
                            </song>
                            </xsl:for-each>
                            </songs>
                            <albumReleases>
                            <xsl:for-each select="{19}">
                            <release>
                                    <date>
                                        <xsl:value-of select="{20}"/>
                                    </date>
                                    <country>
                                        <xsl:value-of select="{21}"/>
                                    </country>
                                    <recordLabel>
                                        <xsl:value-of select="{22}"/>
                                    </recordLabel>
                                    <tracks>
                                        <xsl:value-of select="{23}"/>
                                    </tracks>
                                    <format>
                                        <xsl:value-of select="{24}"/>
                                    </format>
                                    <catalogNumber>
                                        <xsl:value-of select="{25}"/>
                                    </catalogNumber>
                                    <barCode>
                                        <xsl:value-of select="{26}"/>
                                    </barCode>
                            </release>
                            </xsl:for-each>
                            </albumReleases>
                            <albumImage>
                            <xsl:attribute name="src">
                                    <xsl:value-of select="{27}"/>
                            </xsl:attribute>
                            <xsl:value-of select="{28}"/>
                            </albumImage>
                            <comment>
                            <xsl:value-of select="{29}"/>
                            </comment>
                            

                      </album>
                 </albums>
                 </artist>
            </xsl:for-each>
         </music>
    </xsl:template>
    </xsl:stylesheet>"""
    xslOutput = xsl.format(rootPath, extractPath(-2, artistName), extractPath(-2, artistType), '3', extractPath(-2, careerDate), extractPath(-2, artistGenre), extractPath(-2, albumCategory), extractPath(-2, albumName), extractPath(-2, albumRating), extractPath(-2, albumSKU), extractPath(-2, albumType),\
                     extractPath(1,extractPath(-2, trackSKU)),"0",extractPath(-5, trackSKU),extractPath(-5, trackType),extractPath(-5, trackPosition),extractPath(-5, trackTitle),extractPath(-5, trackComposer),extractPath(-5, trackTime),\
                     extractPath(1,extractPath(-2, releaseDate)),extractPath(-5, releaseDate),extractPath(-5,releaseCountry), extractPath(-5,releaseLabel),"foo",extractPath(-5,releaseFormat),extractPath(-5,releaseCatalog),extractPath(-5,releaseBar),extractPath(-2,picSRC), extractPath(-2,picPath),\
                    extractPath(-2,comment), "foo", "bar")
    x=open(str(counter)+".xsl","w")
    x.write(xslOutput)
    x.close()
    counter +=1
