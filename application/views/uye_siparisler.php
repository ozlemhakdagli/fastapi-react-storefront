

	<section>
		
			<div class="row">
				
				<div class="col-sm-7">
					<div class="blog-post-area">
						<h2 class="title text-center">Yapılan Siparişler</h2>
						<div class="single-blog-post">
						
							
							<?php if ($this->session->flashdata('mesaj')) 
			  { ?>
			  <div >
                <h3><?=$this->session->flashdata('mesaj')?></h3>
								<?php } ?>
								<?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div >
                <h3><?=$this->session->flashdata('sonuc')?></h3>
								<?php } ?>
									              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  
                  <th bgcolor="#ff9933">Sıra No</th>
                  <th bgcolor="#ff9933">Tarih</th>
				  <th bgcolor="#ff9933">Tutar</th>
				  <th bgcolor="#ff9933">Durum</th>
				  <th bgcolor="#ff9933">Detay</th>
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				
				foreach($siparisler as $rs)
				{	
                ?>
				
				
				<tr>
                  
                  <td><?=++$i?></td>
                  <td><?=$rs->tarih?></td>
				  <td><?=$rs->tutar?></td>
				  <td><?=$rs->durum?></td>
				  
				 
				 
				 
				 <td>
                   
                    <div>
                    <a href ="<?=base_url() ?>home/siparis_detay/<?=$rs->Id?>" ><button type="button" class="btn btn-success">Detay</button></a>
                    <a href ="<?=base_url() ?>home/siparissil/<?=$rs->Id?>" ><button type="button" class="btn btn-danger">Sil</button></a>
                    </div>
                  </td>
				  
                </tr>
				
				
				
				
				
				 <?php
				}
                ?>
				</tbody>
                
                
              </table>


				
				
			
	


	
						</div>
					</div><!--/blog-post-area-->

				

					
					
				</div>	
			</div>
		
	</section>
	

  

</body>
</html>