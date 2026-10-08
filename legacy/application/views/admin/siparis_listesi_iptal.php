
            <div class="box-header">
                
								<?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div >
                <h3><?=$this->session->flashdata('sonuc')?></h3>
								<?php } ?>
			<h2 align="center" font-weight=" bold">İptal Edilmiş Siparişler</h2><br>
			 
              
            </div>
            <!-- /.box-header -->
            <div class="box-body table-responsive no-padding">
              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  
                  <th bgcolor="	#99ccff">Sıra No</th>
                  <th bgcolor="	#99ccff">Tarih</th>
				  <th bgcolor="	#99ccff">Tutar</th>
				  <th bgcolor="	#99ccff">Durum</th>
				  <th bgcolor="	#99ccff">Detay</th>
				  
				  
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				foreach($veriler as $rs)
				{
                ?>
				
				
				
				<tr>
                  
                  <td><?=++$i?></td>
                  <td><?=$rs->tarih?></td>
				  <td><?=$rs->tutar?></td>
				  <td><?=$rs->durum?></td>
				  
				 
				 
				 
				 <td>
                   
           
                    <a href ="<?=base_url() ?>admin/siparisler/siparis_detay/<?=$rs->Id?>" ><button type="button" class="btn btn-success">Detay</button></a>
                    <a href ="<?=base_url() ?>admin/siparisler/s_delete/<?=$rs->Id?>" ><button type="button" class="btn btn-danger">Sil</button></a>
                    </div>
                  </td>
				  
                </tr>
				
				
				
				
				
				 <?php
				}
                ?>
				</tbody>
                
                
              </table>
            </div>
            <!-- /.box-body -->
       
    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  
